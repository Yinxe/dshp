/**
 * SkillSection（设置 → 技能管理）
 * 参考 ZCode 技能页布局：范围切换（全局/工作区）+ 计数 + 搜索 + 「⋯/刷新/＋新建」工具栏
 * + 紧凑单行列表。控件尽量用官方 @deepseek-ai/dsh-client-ui-primitives 原语
 * （Button/Input/Switch/Tag/Menu/Modal + 原生图标），自创 CSS 只负责布局。
 *
 * 组件是**普通函数组件**（`.tsx` + JSX），不再是 `createSkillSection(React, P)` /
 * `createSessionInputProbe(React)` 工厂：`useState` / `useEffect` / `useRef` 直接从 `react` import，
 * 官方构件按名从 primitives import（都是 devDependency，只参与类型检查与构建，运行时由 shell 的
 * 冻结模块表注入）。
 *
 * 本文件除设置节 {@link SkillSection} 外还导出：
 *  - {@link ctxHolder}：模块级 ctx 持有（由 `index.tsx` 的 `apply` 赋值），供「新建」流程读取
 *    `uiWorkspace` 等可选服务；
 *  - {@link SkillInputProbe}：`conversation.input.right` 的零尺寸探针。
 *
 * @module @dshp/skill-manager/client/SkillSection
 */
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  IconCopyOutlineRegular,
  IconEditOutlineRegular,
  IconEllipsisOutlineRegular,
  IconLoadingOutlineRegular,
  IconPlusOutlineRegular,
  IconRefreshOutlineRegular,
  IconSearchOutlineRegular,
  IconSkillOutlineRegular,
  IconTrashOutlineRegular,
  Input,
  Modal,
  Pill,
} from '@deepseek-ai/dsh-client-ui-primitives';
import type { ReactNode } from 'react';
import {
  createSkill,
  fetchSkill,
  fetchState,
  removeSkill,
  saveConfig,
  toggleSkill,
  transferSkill,
  updateSkill,
} from './api.js';
import { ActionMenu, Badge, Selector, Switch, cx } from './components.js';
import styles from './styles.module.css';
import type { ClientContext, RootInfo, SkillEntry, SkillState } from './types.js';

const SCOPE_KEY = 'dshp-skill-manager.scope';

/** 宿主 ctx 引用（apply 时注入），供「新建」流程读取 uiWorkspace 等可选服务 */
export const ctxHolder: { current: ClientContext | null } = { current: null };

/** 可选服务 `uiWorkspace`：本插件只用到 `startSession`（在点「新建」时开一个新会话）。 */
interface UiWorkspace {
  startSession?: () => void;
}

/** 会话输入框的动作接口（会话标准 props 的 `inputActions`，本插件只用 `setDraft`）。 */
interface InputActions {
  setDraft: (text: string) => void;
}

/** `conversation.input.right` 槽位给探针的 props（只读这两个字段）。 */
interface SkillInputProbeProps {
  inputActions?: InputActions | undefined;
  sessionId?: unknown;
}

/** 编辑弹窗的三段草稿（改动先落本地，点保存才提交）。 */
interface EditDraft {
  description: string;
  whenToUse: string;
  body: string;
}

/** 「复制 / 移动」弹窗状态。 */
interface MoveState {
  entry: SkillEntry;
  toScope: string;
  toSuffix: 'agents' | 'dsh';
  mode: 'copy' | 'move';
}

/** 「新建技能」表单状态。 */
interface CreateDraft {
  toScope: string;
  toSuffix: 'agents' | 'dsh';
  name: string;
  kind: 'bundle' | 'flat';
  description: string;
  whenToUse: string;
  body: string;
}

/** 会话输入探针共享态：探针组件写入 inputActions/sessionId，「新建」流程消费 */
const probeState: {
  sessionId: unknown;
  actions: InputActions | null;
  clickSessionId: unknown;
  pendingDraft: string;
  pendingDeadline: number;
} = { sessionId: null, actions: null, clickSessionId: null, pendingDraft: '', pendingDeadline: 0 };

/**
 * conversation.input.right 的零尺寸占位（list 槽，纯附加不改动 composer）。
 * 唯一职责：接收会话标准 props（inputActions/sessionId），并把点击「新建」时
 * 挂起的 /skill-creator 草稿写进「与点击时不同」的那个会话输入框。
 *
 * @param props - 会话标准 props（本插件只读 inputActions / sessionId）。
 * @returns null（零尺寸占位）。
 */
export function SkillInputProbe(props: SkillInputProbeProps): ReactNode {
  useEffect(() => {
    probeState.actions = props.inputActions ?? null;
    probeState.sessionId = props.sessionId ?? null;
    if (pendingDraftDue() && probeState.actions && probeState.sessionId !== probeState.clickSessionId) {
      const text = probeState.pendingDraft;
      probeState.pendingDraft = '';
      try {
        probeState.actions.setDraft(text);
      } catch {
        /* ignore */
      }
    }
  });
  return null;
}

function pendingDraftDue(): boolean {
  if (!probeState.pendingDraft) return false;
  if (Date.now() > probeState.pendingDeadline) {
    probeState.pendingDraft = '';
    return false;
  }
  return true;
}

function basename(p: string): string {
  const parts = (p || '').split('/').filter((x) => x !== '');
  return parts.length > 0 ? (parts[parts.length - 1] as string) : p;
}

function skillKey(entry: SkillEntry): string {
  return entry.rootId + '::' + entry.name;
}

const CREATE_BODY_TEMPLATE = '# 技能名\n\n## 什么时候用\n\n- \n\n## 步骤\n\n1. \n';

/** 技能名前端校验（与 host 的 SKILL_NAME_PATTERN 一致） */
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 复制文本：优先异步剪贴板，非安全上下文（LAN http）退回 execCommand */
function copyToClipboard(text: string): void {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
      return;
    }
  } catch {
    /* fall through */
  }
  legacyCopy(text);
}

function legacyCopy(text: string): void {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch {
    /* ignore */
  }
}

/** 设置节组件（无 props，由槽位直接渲染）。 */
export function SkillSection(): ReactNode {
  const [state, setState] = useState<SkillState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scope, setScope] = useState('global');
  const [query, setQuery] = useState('');
  const [installOpen, setInstallOpen] = useState(false);
  const [extraRootOpen, setExtraRootOpen] = useState(false);
  const [editing, setEditing] = useState('');
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editInfo, setEditInfo] = useState<SkillEntry | null>(null);
  const [editNameDraft, setEditNameDraft] = useState('');
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>({
    toScope: 'global',
    toSuffix: 'agents',
    name: '',
    kind: 'bundle',
    description: '',
    whenToUse: '',
    body: CREATE_BODY_TEMPLATE,
  });
  const [confirmTarget, setConfirmTarget] = useState<SkillEntry | null>(null);
  const [moveState, setMoveState] = useState<MoveState | null>(null);
  const [wsRootDraft, setWsRootDraft] = useState('');

  function flash(msg: string): void {
    setNotice(msg);
    try {
      window.setTimeout(() => setNotice((cur: string) => (cur === msg ? '' : cur)), 4000);
    } catch {
      /* ignore */
    }
  }

  function adoptState(next: SkillState): void {
    setState(next);
    setWsRootDraft(next.workspaceRoot || '');
    if (next.workspaces.length > 0 && next.workspaces.indexOf(scope) < 0) setScope('global');
  }

  function load(): void {
    setLoading(true);
    setError('');
    fetchState()
      .then((res) => {
        if (res && res.ok && res.state) {
          let saved = 'global';
          try {
            saved = window.localStorage.getItem(SCOPE_KEY) || 'global';
          } catch {
            /* ignore */
          }
          if (saved !== 'global' && res.state.workspaces.indexOf(saved) >= 0) setScope(saved);
          adoptState(res.state);
        } else {
          setError((res && res.error) || '无法读取技能目录');
        }
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError('读取技能目录失败：' + String((e as Error)?.message ?? e));
        setLoading(false);
      });
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 窗口聚焦时静默刷新（外部 IDE / git 改动技能文件后，回来即见最新），不闪加载态 */
  const focusRef = useRef<(() => void) | null>(null);
  focusRef.current = () => {
    if (loading || saving || editing || creating || moveState || confirmTarget || extraRootOpen) return;
    fetchState()
      .then((res) => {
        if (res && res.ok && res.state) adoptState(res.state);
      })
      .catch(() => {
        /* ignore */
      });
  };
  useEffect(() => {
    const onFocus = () => focusRef.current && focusRef.current();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function applyResult(res: { ok: boolean; error?: string; state?: unknown }, okMsg: string): boolean {
    if (res && res.ok && res.state) {
      adoptState(res.state as SkillState);
      flash(okMsg);
      setSaving(false);
      return true;
    }
    setError('操作失败：' + String((res && res.error) || '未知错误'));
    setSaving(false);
    return false;
  }

  function run<T>(p: Promise<T>, okMsg: string, after?: () => void): void {
    setSaving(true);
    setError('');
    p.then((res) => {
      const done = applyResult(res as { ok: boolean; error?: string; state?: unknown }, okMsg);
      if (after && done) after();
    }).catch((e: unknown) => {
      setError('操作失败：' + String((e as Error)?.message ?? e));
      setSaving(false);
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <IconLoadingOutlineRegular />
          <span className={styles.loadingText}>正在读取技能目录…</span>
        </div>
      </div>
    );
  }

  const enabled = !!(state && state.enabled);
  const roots: RootInfo[] = state ? state.roots : [];
  const skills: SkillEntry[] = state ? state.skills : [];
  const isGlobal = scope === 'global';
  const scopeRoots = roots.filter((r) =>
    isGlobal ? r.scope === 'global' : r.scope === 'workspace' && r.workspace === scope,
  );
  const scopeSkills = skills.filter((s) =>
    isGlobal ? s.scope === 'global' : s.scope === 'workspace' && s.workspace === scope,
  );
  const q = query.trim().toLowerCase();
  const visibleSkills = q
    ? scopeSkills.filter(
        (s) =>
          s.name.toLowerCase().indexOf(q) >= 0 ||
          s.description.toLowerCase().indexOf(q) >= 0 ||
          s.whenToUse.toLowerCase().indexOf(q) >= 0,
      )
    : scopeSkills;
  const disabledCtl = saving || !enabled;
  /** 全局是否已装 skill-creator（任意有效技能根里存在即可） */
  const skillCreatorReady = skills.some((s) => s.name === 'skill-creator' && s.valid);

  /** 位置（全局 / 某工作区）+ 目录（agents/dsh）→ 具体技能根 */
  function rootOf(scopeKey: string, suffix: 'agents' | 'dsh'): RootInfo | undefined {
    return roots.find(
      (r) =>
        r.id.endsWith('-' + suffix) &&
        (scopeKey === 'global' ? r.scope === 'global' : r.scope === 'workspace' && r.workspace === scopeKey),
    );
  }

  function scopeLabel(scopeKey: string): string {
    return scopeKey === 'global' ? '全局（所有工作区）' : basename(scopeKey);
  }

  /** 位置选择项：全局 + 各工作区（直接列工作区名） */
  const scopeOptions = [{ id: 'global', label: '全局（所有工作区）' }].concat(
    (state ? state.workspaces : []).map((w: string) => ({ id: w, label: basename(w) })),
  );
  const dirOptions = [
    { id: 'agents', label: '.agents/skills（推荐）' },
    { id: 'dsh', label: '.dsh/skills' },
  ];

  function pickScope(id: string): void {
    setScope(id);
    setQuery('');
    try {
      window.localStorage.setItem(SCOPE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  function startEdit(entry: SkillEntry): void {
    if (disabledCtl) return;
    setEditing(skillKey(entry));
    setEditDraft(null);
    setEditInfo(entry);
    setEditNameDraft(entry.name);
    fetchSkill(entry.rootId, entry.name)
      .then((res) => {
        if (res && res.ok && res.entry) {
          const desc = (res.fields || []).find((f) => f.key === 'description');
          const when = (res.fields || []).find((f) => f.key === 'whenToUse');
          setEditDraft({
            description: desc ? desc.value : res.entry?.description || '',
            whenToUse: when ? when.value : res.entry?.whenToUse || '',
            body: res.body || '',
          });
          setEditInfo(res.entry);
          setEditNameDraft(res.entry.name);
        } else {
          setError('读取技能失败：' + String((res && res.error) || '未知错误'));
          setEditing('');
        }
      })
      .catch((e: unknown) => {
        setError('读取技能失败：' + String((e as Error)?.message ?? e));
        setEditing('');
      });
  }

  /** 保存 = 先写字段；名字有改动再改名。改名失败时弹窗保持打开以便重试。 */
  async function saveEdit(): Promise<void> {
    if (!editDraft || !editInfo || saving) return;
    const target = editInfo;
    const newName = editNameDraft.trim() || target.name;
    setSaving(true);
    setError('');
    try {
      const r1 = await updateSkill({
        rootId: target.rootId,
        name: target.name,
        description: editDraft.description,
        whenToUse: editDraft.whenToUse,
        body: editDraft.body,
      });
      if (!r1 || r1.ok !== true) {
        setError('保存失败：' + String((r1 && r1.error) || '未知错误'));
        return;
      }
      if (r1.state) adoptState(r1.state as SkillState);
      if (newName !== target.name) {
        const r2 = await transferSkill({
          fromRootId: target.rootId,
          fromName: target.name,
          toRootId: target.rootId,
          toName: newName,
          deleteSource: true,
        });
        if (!r2 || r2.ok !== true) {
          setError('字段已保存，但改名失败：' + String((r2 && r2.error) || '未知错误'));
          return;
        }
        adoptState(r2.state as SkillState);
        flash('已保存并改名为 ' + newName);
      } else {
        flash('已保存 ' + target.name);
      }
      setEditing('');
      setEditDraft(null);
      setEditInfo(null);
    } catch (e) {
      setError('保存失败：' + String((e as Error)?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  /** field 'all' = 启用/禁用整个技能；'model' / 'user' = 编辑弹窗里的细粒度开关 */
  function toggle(entry: SkillEntry, field: 'model' | 'user' | 'all'): void {
    const value =
      field === 'all'
        ? !(entry.modelInvocable || entry.userInvocable)
        : field === 'model'
          ? !entry.modelInvocable
          : !entry.userInvocable;
    run(
      toggleSkill({ rootId: entry.rootId, name: entry.name, field, value }),
      (field === 'all' ? (value ? '已启用 ' : '已禁用 ') : '已更新 ') + entry.name,
    );
  }

  function openMove(entry: SkillEntry): void {
    // 默认目标：工作区技能 → 全局；全局技能 → 第一个工作区；目录默认 .agents
    const defaultScope = entry.scope === 'global' ? (state && state.workspaces[0]) || 'global' : 'global';
    setMoveState({ entry, toScope: defaultScope, toSuffix: 'agents', mode: 'copy' });
  }

  function applyMove(): void {
    const m = moveState;
    if (!m || saving) return;
    const root = rootOf(m.toScope, m.toSuffix);
    if (!root || root.id === m.entry.rootId) return;
    run(
      transferSkill({
        fromRootId: m.entry.rootId,
        fromName: m.entry.name,
        toRootId: root.id,
        deleteSource: m.mode === 'move',
      }),
      (m.mode === 'move' ? '已移动 ' : '已复制 ') + m.entry.name,
      () => setMoveState(null),
    );
  }

  /**
   * 关闭设置遮罩面板：设置 UI 是 sidebar.settings 槽位的 occupant，开合状态是它
   * 内部私有的，没有跨插件关闭 API；遮罩（mask）的语义就是点击关闭，因此对
   * data-slot 定位到的 [aria-hidden] 遮罩派发一次原生 click。导航重绘可能晚于
   * 本次调用，配一次短延时重试兜底。
   */
  function closeSettingsOverlay(): void {
    try {
      const area = document.querySelector('[data-slot="sidebar.settings"]');
      if (!area) return;
      const overlay = area.querySelector('[role="presentation"]');
      const mask = overlay?.querySelector('[aria-hidden="true"]') ?? overlay?.firstElementChild ?? null;
      if (mask) mask.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch {
      /* ignore */
    }
  }

  /**
   * 「新建」入口：
   *  - 已装 skill-creator → 在当前工作区开一个新会话（uiWorkspace.startSession），
   *    并把 /skill-creator 写进该会话的输入框（探针在导航落点消费 pendingDraft）；
   *  - 未装 → 弹窗展示安装命令让用户手工执行（自动安装成功率不可控），装完点「刷新」。
   * 手动建表单保留在「⋯ → 手动新建技能…」。
   */
  function handleNewClick(): void {
    if (disabledCtl) return;
    if (!skillCreatorReady) {
      setInstallOpen(true);
      return;
    }
    const ws = ctxHolder.current?.get?.('uiWorkspace') as UiWorkspace | undefined;
    if (ws && typeof ws.startSession === 'function') {
      probeState.clickSessionId = probeState.sessionId;
      probeState.pendingDraft = '/skill-creator';
      probeState.pendingDeadline = Date.now() + 30000;
      try {
        ws.startSession();
        flash('已在新会话输入框插入 /skill-creator，发送即可开始生成技能');
        closeSettingsOverlay();
        try {
          window.setTimeout(closeSettingsOverlay, 200);
        } catch {
          /* ignore */
        }
        return;
      } catch {
        probeState.pendingDraft = '';
        /* startSession 失败走剪贴板兜底 */
      }
    }
    copyToClipboard('/skill-creator');
    flash('已复制 /skill-creator：新建一个会话并粘贴发送即可开始生成技能');
  }

  function doRemove(): void {
    const entry = confirmTarget;
    if (!entry) return;
    setConfirmTarget(null);
    run(removeSkill({ rootId: entry.rootId, name: entry.name }), '已删除 ' + entry.name, () => {
      if (editing === skillKey(entry)) {
        setEditing('');
        setEditDraft(null);
        setEditInfo(null);
      }
    });
  }

  function submitCreate(): void {
    const d = createDraft;
    const root = rootOf(d.toScope, d.toSuffix);
    if (!root) {
      setError('目标位置无效：请重新选择位置与目录');
      return;
    }
    run(
      createSkill({
        rootId: root.id,
        name: d.name.trim(),
        description: d.description,
        whenToUse: d.whenToUse,
        body: d.body,
        kind: d.kind,
      }),
      '已创建 ' + (d.name.trim() || '技能'),
      () => {
        setCreating(false);
        setCreateDraft({
          toScope: 'global',
          toSuffix: 'agents',
          name: '',
          kind: 'bundle',
          description: '',
          whenToUse: '',
          body: CREATE_BODY_TEMPLATE,
        });
      },
    );
  }

  function saveWsRoot(): void {
    const v = wsRootDraft.trim();
    if (state && v === (state.workspaceRoot || '')) {
      setExtraRootOpen(false);
      return;
    }
    run(saveConfig({ workspaceRoot: v }), v ? '已保存工作区根目录' : '已清空工作区根目录', () =>
      setExtraRootOpen(false),
    );
  }

  function skillRow(entry: SkillEntry): ReactNode {
    const rootBadge = entry.rootId.endsWith('-dsh') ? '.dsh' : '.agents';
    const titleChildren: ReactNode[] = [
      <span key="n" className={styles.mono}>
        {entry.name}
      </span>,
      <Badge key="root" kind="info" text={rootBadge} />,
    ];
    if (entry.valid) {
      titleChildren.push(
        <Badge key="kind" kind="muted" text={entry.kind === 'bundle' ? '目录包' : '单文件'} />,
      );
      if (entry.shadowedBy) {
        const winner = roots.find((r) => r.id === entry.shadowedBy);
        titleChildren.push(
          <Badge
            key="shadow"
            kind="warn"
            text={'被 ' + (winner ? winner.label : entry.shadowedBy) + ' 同名技能遮蔽'}
          />,
        );
      }
    } else {
      titleChildren.push(<Badge key="bad" kind="err" text={entry.problem || '解析失败'} />);
    }
    const fullTip = entry.description + (entry.whenToUse ? '\n何时使用：' + entry.whenToUse : '');
    return (
      <div key={skillKey(entry)} className={styles.row}>
        <div className={styles.tile}>
          <IconSkillOutlineRegular />
        </div>
        <div className={styles.rowText}>
          <div className={styles.title}>{titleChildren}</div>
          <div className={styles.line} title={fullTip}>
            {entry.valid ? entry.description || '（无 description）' : entry.problem || '解析失败'}
          </div>
        </div>
        <div className={styles.controls}>
          <Switch
            checked={entry.modelInvocable || entry.userInvocable}
            disabled={disabledCtl || !entry.valid}
            label={'启用 / 禁用 ' + entry.name}
            title="启用 / 禁用（可在编辑弹窗里分别控制模型与用户调用面）"
            onChange={() => toggle(entry, 'all')}
          />
          <Button
            variant="toolbar"
            disabled={disabledCtl}
            title={'编辑 ' + entry.name}
            onClick={() => startEdit(entry)}
          >
            <IconEditOutlineRegular />
          </Button>
          <Button
            variant="toolbar"
            disabled={disabledCtl || !entry.valid}
            title={'复制 / 移动 ' + entry.name}
            onClick={() => openMove(entry)}
          >
            <IconCopyOutlineRegular />
          </Button>
          <Button
            variant="toolbar"
            className={styles.danger}
            disabled={disabledCtl}
            title={'删除 ' + entry.name}
            onClick={() => setConfirmTarget(entry)}
          >
            <IconTrashOutlineRegular />
          </Button>
        </div>
      </div>
    );
  }

  /** 编辑弹窗的实时条目（细粒度开关读取最新 state，toggle 后立即反映） */
  function editLive(): SkillEntry | null {
    if (!editInfo) return null;
    return skills.find((s) => s.rootId === editInfo.rootId && s.name === editInfo.name) ?? editInfo;
  }

  function editorModal(): ReactNode {
    const live = editLive();
    const nameOk = SKILL_NAME_RE.test(editNameDraft.trim());
    const nameChanged = editNameDraft.trim() !== '' && editNameDraft.trim() !== (live ? live.name : '');
    return (
      <Modal
        open={editInfo !== null}
        onClose={() => {
          setEditing('');
          setEditDraft(null);
          setEditInfo(null);
        }}
        className={cx(styles.wideModal)}
        title="编辑技能"
        closeLabel="关闭"
        // 官方 `Modal.description` 声明成 `string`（没有 `| undefined`），
        // `exactOptionalPropertyTypes` 下不能传 undefined；原实现里 `live` 为空时传的就是
        // undefined（等于不传），这里按「有值才传」展开，渲染结果一致。
        {...(live ? { description: '位置：' + live.entryPath } : {})}
        footer={
          <div className={styles.bar}>
            <Button variant="primary" disabled={saving || !editDraft || !nameOk} onClick={saveEdit}>
              {nameChanged ? '保存并改名' : '保存'}
            </Button>
            <Button disabled={saving} onClick={() => setEditInfo(null)}>
              取消
            </Button>
            {!nameOk ? (
              <span className={cx(styles.notice, styles.noticeErr)}>
                技能名需为小写 kebab-case（字母 / 数字 / 连字符）
              </span>
            ) : null}
          </div>
        }
      >
        <div className={styles.form}>
          {!editDraft || !live ? (
            <div className={styles.loading}>
              <IconLoadingOutlineRegular />
              <span className={styles.loadingText}>正在读取技能全文…</span>
            </div>
          ) : (
            [
              <div key="ln" className={styles.fieldLabel}>
                技能名（小写 kebab-case；改动会连同目录/文件一起改名）
              </div>,
              <Input
                key="n"
                className={cx(styles.mono)}
                disabled={saving}
                value={editNameDraft}
                onChange={(e) => setEditNameDraft(e.target.value)}
              />,
              <div key="ld" className={styles.fieldLabel}>
                description（目录摘要，模型检索靠它；≤500 字符）
              </div>,
              <textarea
                key="d"
                className={styles.textarea}
                disabled={saving}
                rows={3}
                value={editDraft.description}
                onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
              />,
              <div key="lw" className={styles.fieldLabel}>
                触发条件 whenToUse（可选；留空并保存即删除该键）
              </div>,
              <textarea
                key="w"
                className={styles.textarea}
                disabled={saving}
                rows={2}
                placeholder="什么情况下应加载这个技能，例如“用户要求 TDD / 先写测试时”"
                value={editDraft.whenToUse}
                onChange={(e) => setEditDraft({ ...editDraft, whenToUse: e.target.value })}
              />,
              <div key="ls" className={styles.fieldLabel}>
                调用面（细粒度；行内「启用」开关控制整体）
              </div>,
              <div key="s" className={styles.surfaceRow}>
                <span className={styles.ctlLabel}>
                  模型可调用
                  <Switch
                    checked={live.modelInvocable}
                    disabled={saving || !live.valid}
                    label="允许模型通过 skill 工具加载"
                    onChange={() => toggle(live, 'model')}
                  />
                </span>
                <span className={styles.ctlLabel}>
                  用户可 /name 调用
                  <Switch
                    checked={live.userInvocable}
                    disabled={saving || !live.valid}
                    label="允许用户以 /名字 直接调用"
                    onChange={() => toggle(live, 'user')}
                  />
                </span>
              </div>,
              <div key="lb" className={styles.fieldLabel}>
                正文（frontmatter 之后的 Markdown）
              </div>,
              <textarea
                key="b"
                className={cx(styles.textarea, styles.textareaMono)}
                disabled={saving}
                rows={16}
                spellCheck={false}
                value={editDraft.body}
                onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })}
              />,
            ]
          )}
        </div>
      </Modal>
    );
  }

  function moveModal(): ReactNode {
    const m = moveState;
    const destRoot = m ? rootOf(m.toScope, m.toSuffix) : undefined;
    const sameRoot = !!(m && destRoot && destRoot.id === m.entry.rootId);
    return (
      <Modal
        open={m !== null}
        onClose={() => setMoveState(null)}
        className={cx(styles.wideModal)}
        title={
          (m ? (m.mode === 'move' ? '移动技能' : '复制技能') : '复制 / 移动技能') +
          (m ? ' · ' + m.entry.name : '')
        }
        closeLabel="关闭"
        description="复制/移动目录包时保留 references、scripts 等资源；跨同名目录会拒绝覆盖。"
        footer={
          <div className={styles.bar}>
            <Button variant="primary" disabled={!m || saving || sameRoot} onClick={applyMove}>
              {m && m.mode === 'move' ? '移动' : '复制'}
            </Button>
            <Button disabled={saving} onClick={() => setMoveState(null)}>
              取消
            </Button>
            {sameRoot ? <span className={cx(styles.notice, styles.noticeErr)}>目标与来源相同</span> : null}
          </div>
        }
      >
        <div className={styles.form}>
          {m
            ? [
                <div key="lt" className={styles.fieldLabel}>
                  操作
                </div>,
                <div key="t" className={styles.bar}>
                  <Pill active={m.mode === 'copy'} onClick={() => setMoveState({ ...m, mode: 'copy' })}>
                    复制
                  </Pill>
                  <Pill active={m.mode === 'move'} onClick={() => setMoveState({ ...m, mode: 'move' })}>
                    移动（删除原位置）
                  </Pill>
                </div>,
                <div key="lw" className={styles.fieldLabel}>
                  目标工作区
                </div>,
                <Selector
                  key="w"
                  disabled={saving}
                  value={m.toScope}
                  selectedLabel={scopeLabel(m.toScope)}
                  options={scopeOptions}
                  onSelect={(id) => setMoveState({ ...m, toScope: id })}
                />,
                <div key="ld" className={styles.fieldLabel}>
                  目标目录
                </div>,
                <Selector
                  key="d"
                  disabled={saving}
                  value={m.toSuffix}
                  selectedLabel={m.toSuffix === 'agents' ? '.agents/skills（推荐）' : '.dsh/skills'}
                  options={dirOptions}
                  onSelect={(id) => setMoveState({ ...m, toSuffix: id === 'dsh' ? 'dsh' : 'agents' })}
                />,
                destRoot ? (
                  <div key="p" className={styles.rootPath}>
                    {destRoot.path}
                  </div>
                ) : null,
              ]
            : null}
        </div>
      </Modal>
    );
  }

  function createModal(): ReactNode {
    const chosenRoot = rootOf(createDraft.toScope, createDraft.toSuffix);
    const nameOk = SKILL_NAME_RE.test(createDraft.name.trim());
    return (
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        className={cx(styles.wideModal)}
        title="新建技能"
        closeLabel="关闭"
        description="创建后目录会被 harness 实时发现，下一个模型步骤即可使用。"
        footer={
          <div className={styles.bar}>
            <Button
              variant="primary"
              disabled={saving || !createDraft.name.trim() || !createDraft.description.trim() || !nameOk}
              onClick={submitCreate}
            >
              创建
            </Button>
            <Button disabled={saving} onClick={() => setCreating(false)}>
              取消
            </Button>
            {createDraft.name.trim() && !nameOk ? (
              <span className={cx(styles.notice, styles.noticeErr)}>
                技能名需为小写 kebab-case（字母 / 数字 / 连字符）
              </span>
            ) : null}
          </div>
        }
      >
        <div className={styles.form}>
          <div className={styles.fieldLabel}>位置与形态</div>
          <div className={styles.bar}>
            <Selector
              disabled={saving}
              value={createDraft.toScope}
              selectedLabel={scopeLabel(createDraft.toScope)}
              options={scopeOptions}
              onSelect={(id) => setCreateDraft({ ...createDraft, toScope: id })}
            />
            <Selector
              disabled={saving}
              value={createDraft.toSuffix}
              selectedLabel={createDraft.toSuffix === 'agents' ? '.agents/skills（推荐）' : '.dsh/skills'}
              options={dirOptions}
              onSelect={(id) => setCreateDraft({ ...createDraft, toSuffix: id === 'dsh' ? 'dsh' : 'agents' })}
            />
            <Selector
              disabled={saving}
              value={createDraft.kind}
              selectedLabel={createDraft.kind === 'bundle' ? '目录包 <name>/SKILL.md' : '单文件 <name>.md'}
              options={[
                { id: 'bundle', label: '目录包 <name>/SKILL.md' },
                { id: 'flat', label: '单文件 <name>.md' },
              ]}
              onSelect={(id) => setCreateDraft({ ...createDraft, kind: id === 'flat' ? 'flat' : 'bundle' })}
            />
          </div>
          {chosenRoot ? <div className={styles.rootPath}>{chosenRoot.path}</div> : null}
          <div className={styles.fieldLabel}>技能名（小写 kebab-case：字母 / 数字 / 连字符）</div>
          <Input
            className={cx(styles.mono)}
            disabled={saving}
            placeholder="my-new-skill"
            value={createDraft.name}
            onChange={(e) => setCreateDraft({ ...createDraft, name: e.target.value })}
          />
          <div className={styles.fieldLabel}>description（必填，≤500 字符）</div>
          <textarea
            className={styles.textarea}
            disabled={saving}
            rows={2}
            placeholder="一句话说清这个技能做什么、什么时候用（写触发词）"
            value={createDraft.description}
            onChange={(e) => setCreateDraft({ ...createDraft, description: e.target.value })}
          />
          <div className={styles.fieldLabel}>whenToUse（可选）</div>
          <Input
            disabled={saving}
            value={createDraft.whenToUse}
            onChange={(e) => setCreateDraft({ ...createDraft, whenToUse: e.target.value })}
          />
          <div className={styles.fieldLabel}>正文</div>
          <textarea
            className={cx(styles.textarea, styles.textareaMono)}
            disabled={saving}
            rows={10}
            spellCheck={false}
            value={createDraft.body}
            onChange={(e) => setCreateDraft({ ...createDraft, body: e.target.value })}
          />
        </div>
      </Modal>
    );
  }

  function confirmModal(): ReactNode {
    return (
      <Modal
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title="删除技能"
        closeLabel="关闭"
        footer={
          <div className={styles.bar}>
            <Button className={styles.danger} onClick={doRemove}>
              删除
            </Button>
            <Button onClick={() => setConfirmTarget(null)}>取消</Button>
          </div>
        }
      >
        <div className={styles.form}>
          <p className={cx(styles.notice, styles.noticeWarn)}>
            确认删除 {confirmTarget ? confirmTarget.name : ''}
            ？目录包会连同 references / scripts 等资源一起删除，操作不可恢复。
          </p>
          {confirmTarget ? <div className={styles.rootPath}>{confirmTarget.entryPath}</div> : null}
        </div>
      </Modal>
    );
  }

  const SKILL_CREATOR_INSTALL_CMD = 'npx skills install anthropics/skills@skill-creator --global --yes';

  function installModal(): ReactNode {
    return (
      <Modal
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        className={cx(styles.wideModal)}
        title="尚未安装 skill-creator"
        closeLabel="关闭"
        description="skill-creator 是官方的技能生成器。在终端任意目录执行下面的命令全局安装（写入 ~/.agents/skills；个别 agent 适配目标提示不支持属正常噪音，只要 skill-creator 目录出现即成功）。装完回到本页点「刷新」。"
      >
        <div className={styles.form}>
          <Input
            className={cx(styles.mono)}
            readOnly
            value={SKILL_CREATOR_INSTALL_CMD}
            onFocus={(e) => e.target.select()}
          />
          <div className={styles.bar}>
            <Button
              variant="primary"
              onClick={() => {
                copyToClipboard(SKILL_CREATOR_INSTALL_CMD);
                flash('安装命令已复制，去终端执行后回到本页点「刷新」');
              }}
            >
              复制安装命令
            </Button>
            <Button
              onClick={() => {
                copyToClipboard('/skill-creator');
                flash('已复制 /skill-creator：装好后在新建会话里粘贴发送也可以');
              }}
            >
              复制 /skill-creator
            </Button>
          </div>
        </div>
        <Button onClick={() => setInstallOpen(false)}>关闭</Button>
      </Modal>
    );
  }

  function extraRootModal(): ReactNode {
    return (
      <Modal
        open={extraRootOpen}
        onClose={() => setExtraRootOpen(false)}
        title="额外工作区根目录"
        closeLabel="关闭"
        description="填绝对路径（如 /home/me/project）；保存后该目录的 .dsh/skills 与 .agents/skills 会出现在范围切换里。留空则只用 DSH 已登记的工作区。"
        footer={
          <div className={styles.bar}>
            <Button variant="primary" disabled={saving} onClick={saveWsRoot}>
              保存
            </Button>
            <Button disabled={saving} onClick={() => setExtraRootOpen(false)}>
              取消
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            className={cx(styles.mono)}
            disabled={saving}
            placeholder="/home/me/project"
            value={wsRootDraft}
            onChange={(e) => setWsRootDraft(e.target.value)}
          />
        </div>
      </Modal>
    );
  }

  const children: ReactNode[] = [];
  children.push(
    <p className={styles.intro}>
      统一管理全局与工作区技能（SKILL.md）。技能目录被 harness 实时监听，改动即刻生效，无需重启。
    </p>,
  );
  if (error) children.push(<p className={cx(styles.notice, styles.noticeErr)}>{error}</p>);
  if (notice) children.push(<p className={cx(styles.notice, styles.noticeOk)}>{notice}</p>);
  if (!enabled)
    children.push(
      <p className={cx(styles.notice, styles.noticeWarn)}>
        技能管理已关闭：下方开关与按钮均不可用；可在 settings.yaml 的 dshp-skill-manager 分节把 enabled 改回
        true。
      </p>,
    );

  // ── 工具栏：范围切换 + 计数 + 搜索 + 动作（ZCode 技能页同款）─────────
  children.push(
    <div className={styles.toolbar}>
      <Selector
        disabled={saving}
        value={scope}
        selectedLabel={isGlobal ? '全局（所有工作区）' : basename(scope)}
        options={scopeOptions}
        onSelect={pickScope}
      />
      <span className={styles.count}>
        {'技能 ' +
          scopeSkills.length +
          ' · 已启用 ' +
          scopeSkills.filter((s) => s.modelInvocable || s.userInvocable).length}
      </span>
      {q ? <span className={styles.count}>{'· 匹配 ' + visibleSkills.length}</span> : null}
      <div className={styles.toolbarSpacer} />
      <Input
        className={cx(styles.searchW)}
        icon={<IconSearchOutlineRegular />}
        disabled={loading}
        placeholder="搜索技能…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ActionMenu
        disabled={saving}
        icon={<IconEllipsisOutlineRegular />}
        title="更多操作"
        options={[
          { id: 'manual-create', label: '手动新建技能…' },
          { id: 'extra-root', label: '额外工作区根目录…' },
          { id: 'reload', label: '重新读取' },
        ]}
        onPick={(id) => {
          if (id === 'manual-create') {
            if (!createDraft.toScope && scopeRoots.length > 0) {
              const first = scopeRoots[0] as RootInfo;
              setCreateDraft({ ...createDraft, toScope: first.workspace || 'global' });
            }
            setCreating(true);
          } else if (id === 'extra-root') setExtraRootOpen(true);
          else if (id === 'reload') load();
        }}
      />
      <Button variant="toolbar" disabled={saving} title="重新读取" onClick={load}>
        <IconRefreshOutlineRegular size={14} />
      </Button>
      <Button
        variant="primary"
        icon={<IconPlusOutlineRegular />}
        disabled={disabledCtl}
        title={
          skillCreatorReady
            ? '在当前工作区开一个新会话，并把 /skill-creator 插入输入框'
            : '尚未安装 skill-creator：点击查看安装命令'
        }
        onClick={handleNewClick}
      >
        新建
      </Button>
    </div>,
  );
  if (!isGlobal) {
    children.push(
      <div className={styles.toolbar} style={{ borderTop: 'none', paddingTop: 8, paddingBottom: 8 }}>
        <span className={styles.rootPath}>
          {basename(scope) + '：' + scopeRoots.map((r) => r.path).join(' · ')}
        </span>
      </div>,
    );
  }

  // ── 技能列表 ─────────────────────────────────────────────────────────
  // 原 className 是 'sm-section sm-list'：`sm-section` 在 styles.ts 里没有对应规则（纯标记类），
  // CSS Module 化后不再保留它（与 file-change-viewer 去掉 `fcv-toolRow` 同一处理）。
  children.push(<div className={styles.list}>{visibleSkills.map(skillRow)}</div>);
  if (scopeSkills.length === 0) {
    children.push(
      <div className={styles.empty}>
        <div className={styles.tile}>
          <IconSkillOutlineRegular />
        </div>
        <div className={styles.emptyTitle}>{isGlobal ? '全局还没有技能' : '这个工作区还没有技能'}</div>
        <p className={styles.hint}>
          {isGlobal
            ? '用「新建」创建，或把技能放到 ' +
              (state ? state.dshHome + '/skills 或 ' + state.agentsHome + '/skills' : '~/.dsh/skills') +
              ' 下。'
            : '用「新建」创建（默认写入当前范围），或手工创建 .dsh/skills/<name>/SKILL.md。'}
        </p>
      </div>,
    );
  } else if (visibleSkills.length === 0) {
    children.push(
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>{'没有匹配「' + query.trim() + '」的技能'}</div>
      </div>,
    );
  }

  children.push(
    <p className={styles.hint} style={{ marginTop: 4 }}>
      优先级：工作区 .dsh/skills（100） &gt; 工作区 .agents/skills（200） &gt; 全局 ~/.dsh/skills（400） &gt;
      全局
      ~/.agents/skills（500），同名技能低优先级的会被高优先级遮蔽。为防止提示词注入，本插件不向模型开放写入工具，技能文件只能由人在设置页或文件系统里修改。
    </p>,
  );

  // ── 弹窗 ─────────────────────────────────────────────────────────────
  children.push(editorModal(), createModal(), confirmModal(), extraRootModal(), moveModal(), installModal());

  return <div className={styles.page}>{children}</div>;
}
