/**
 * `patch` 工具的纯函数冒烟测试：`*** Begin Patch` 信封的解析与应用
 *
 * 直接 import `lib/host.js`（Host 产物把 `src/shared/apply-patch.ts` 内联进去了，并额外导出这些
 * 函数），不启动 DSH、不碰真实文件系统。盯的是「模型给的补丁文本 → 文件内容」这条最要紧的路径：
 * 多文件多片段、四级模糊定位、`*** End of File` 锚点、纯追加片段、行尾与末尾换行、以及**不匹配时
 * 必须整体失败、绝不写坏文件**。
 *
 * 只用 node 内建模块，零依赖。
 */

import assert from 'node:assert/strict';

const host = await import('../lib/host.js');
const {
  parseApplyPatch,
  applyChunksToText,
  previewDiffsOf,
  countLogicalLines,
  detectLineEnding,
  normalizeLineEndings,
  restoreLineEndings,
} = host;

let checks = 0;
function ok(label, condition) {
  checks += 1;
  assert.ok(condition, label);
}

function throws(label, fn, fragment) {
  checks += 1;
  let error = null;
  try {
    fn();
  } catch (caught) {
    error = caught;
  }
  assert.ok(error !== null, label + '（应当抛错）');
  if (fragment !== undefined) {
    assert.ok(
      String(error.message).includes(fragment),
      label + '：错误消息里应包含 ' + JSON.stringify(fragment) + '，实际是 ' + JSON.stringify(error.message),
    );
  }
}

// 行首标记 + 原文：手写这些前缀太容易数错空格，统一用 helper 拼。
const ctx = (text) => ' ' + text;
const add = (text) => '+' + text;
const del = (text) => '-' + text;
/** 包一个完整的补丁信封。 */
const envelope = (...lines) => ['*** Begin Patch', ...lines, '*** End Patch'].join('\n');
/** 解析出唯一一个段落（多数断言只需要它）。 */
const one = (text) => {
  const ops = parseApplyPatch(text);
  assert.equal(ops.length, 1, '这份补丁应当只解析出一个段落：' + text);
  return ops[0];
};

// ── 解析：三种段头 + 改名 + 锚点 + End of File ───────────────────────────────

{
  const ops = parseApplyPatch(
    envelope(
      '*** Add File: notes/t.md',
      add('| a | b |'),
      add('| --- | --- |'),
      '*** Delete File: obsolete.txt',
      '*** Update File: src/app.py',
      '*** Move to: src/main.py',
      '@@ def greet():',
      del('print("Hi")'),
      add('print("Hello, world!")'),
      ctx('return 0'),
      '*** End of File',
    ),
  );
  ok('解析出三个段落（Add / Delete / Update）', ops.length === 3);
  ok('Add 段落的路径与内容', ops[0].type === 'add' && ops[0].path === 'notes/t.md');
  ok('Add 段落的 + 行原样成为内容（不含 + 标记）', ops[0].contents === '| a | b |\n| --- | --- |');
  ok('Delete 段落只有路径', ops[1].type === 'delete' && ops[1].path === 'obsolete.txt');
  ok('Update 段落带上了 Move to', ops[2].type === 'update' && ops[2].moveTo === 'src/main.py');
  const chunk = ops[2].chunks[0];
  ok('片段里的锚点被读出来', chunk.context === 'def greet():');
  ok('删除行只进旧侧、上下文两侧都有', chunk.oldLines.join('|') === 'print("Hi")|return 0');
  ok('新增行只进新侧、上下文两侧都有', chunk.newLines.join('|') === 'print("Hello, world!")|return 0');
  ok('End of File 标记被读出来', chunk.endOfFile === true);
  ok('片段自己数了增删行数（不含上下文）', chunk.added === 1 && chunk.removed === 1);
}

ok('空信封解析出零个段落', parseApplyPatch('*** Begin Patch\n*** End Patch').length === 0);
ok(
  '信封之外的行被忽略',
  parseApplyPatch('说明文字\n' + envelope('*** Add File: a.txt', add('x')) + '\n尾巴').length === 1,
);
ok(
  '被 cat <<EOF 包起来的补丁照样解析',
  parseApplyPatch("cat <<'EOF'\n" + envelope('*** Add File: a.txt', add('x')) + '\nEOF').length === 1,
);
ok(
  '未知段头被跳过（不会当成文件段落）',
  parseApplyPatch(envelope('*** Frobnicate File: nope', '*** Add File: a.txt', add('x'))).length === 1,
);
ok(
  '空路径的段头被跳过',
  parseApplyPatch(envelope('*** Add File:', add('x'), '*** Add File: a.txt', add('y'))).length === 1,
);

throws(
  '缺 *** Begin Patch 时非宽容模式报错',
  () => parseApplyPatch('*** Add File: a.txt\n+x'),
  '*** Begin Patch',
);

// 信封有问题时要说清**具体**缺什么（真实会话里抓到过：空补丁 / 缺收尾 / 写成 unified diff）
throws(
  '只写了 *** Begin Patch（空补丁）时点破「补丁是空的」',
  () => parseApplyPatch('*** Begin Patch\n'),
  'patch 是空的',
);
throws(
  '有开头没结尾时说「被截断了？」',
  () => parseApplyPatch('*** Begin Patch\n*** Update File: a.txt\n@@\n-x\n+y\n'),
  '缺收尾',
);
throws(
  '整段写成 unified diff 时点破格式不同',
  () => parseApplyPatch('--- a/a.txt\n+++ b/a.txt\n@@ -1,1 +1,1 @@\n-x\n+y\n'),
  'unified diff',
);
ok(
  'unified diff 的提示里带可照抄的正确格式',
  (() => {
    try {
      parseApplyPatch('--- a/a.txt\n+++ b/a.txt\n@@ -1,1 +1,1 @@\n-x\n+y\n');
      return false;
    } catch (error) {
      return (
        String(error.message).includes('*** Update File:') && String(error.message).includes('*** End Patch')
      );
    }
  })(),
);
throws(
  '缺 *** End Patch 时非宽容模式报错',
  () => parseApplyPatch('*** Begin Patch\n*** Add File: a.txt\n+x'),
  '*** End Patch',
);
ok(
  '宽容模式：缺收尾也不报错（流式预览用）',
  parseApplyPatch('*** Begin Patch\n*** Add File: a.txt\n+x', { tolerant: true }).length === 1,
);
ok(
  '宽容模式：半截的最后一个片段也能解析出来',
  parseApplyPatch(envelope('*** Update File: a.ts', '@@', del('old'), add('par')), { tolerant: true })[0]
    .chunks[0].newLines[0] === 'par',
);

// 片段里的空行 **不** 拆分片段（opencode 同行为）：`-b +B` 与 `-d +D` 会落进同一个片段。
{
  const op = one(envelope('*** Update File: a.ts', '@@', del('b'), add('B'), '', del('d'), add('D')));
  ok('片段里的空行不拆片段', op.chunks.length === 1 && op.chunks[0].oldLines.length === 2);
}

// ── 应用：单片段、多片段、行号、锚点、纯追加 ─────────────────────────────────

{
  const file = 'const a = 1;\nconst b = 2;\n';
  const op = one(envelope('*** Update File: a.ts', '@@', del('const a = 1;'), add('const a = 11;')));
  const applied = applyChunksToText(op.chunks, file, 'a.ts');
  ok('单片段替换生效', applied.content === 'const a = 11;\nconst b = 2;\n');
  ok('片段给了它在文件里的真实行号', applied.chunks[0].startLine === 1);
}

{
  const file = 'line1\nline2\nline3\nline4\n';
  const op = one(
    envelope(
      '*** Update File: a.ts',
      '@@',
      del('line2'),
      add('changed2'),
      '@@',
      del('line4'),
      add('changed4'),
    ),
  );
  const applied = applyChunksToText(op.chunks, file, 'a.ts');
  ok('多处零散修改一次应用', applied.content === 'line1\nchanged2\nline3\nchanged4\n');
  ok('第二个片段的起始行号把前面的漂移算进去了', applied.chunks[1].startLine === 4);
}

{
  const file = 'alpha\nomega\n';
  const op = one(envelope('*** Update File: a.ts', '@@', ctx('alpha'), add('beta'), ctx('omega')));
  ok('插入行落在上下文之间', applyChunksToText(op.chunks, file, 'a.ts').content === 'alpha\nbeta\nomega\n');
}

{
  const file = 'start\nmarker\nmiddle\nmarker\nend\n';
  const op = one(
    envelope(
      '*** Update File: a.ts',
      '@@',
      del('marker'),
      del('end'),
      add('marker-changed'),
      add('end'),
      '*** End of File',
    ),
  );
  ok(
    'End of File 锚点命中文件尾部那一处（不是第一处）',
    applyChunksToText(op.chunks, file, 'a.ts').content === 'start\nmarker\nmiddle\nmarker-changed\nend\n',
  );
}

{
  const file = 'a\nb\n';
  const op = one(envelope('*** Update File: a.ts', '@@', add('c'), add('d')));
  ok('纯 + 行的片段追加到文件末尾', applyChunksToText(op.chunks, file, 'a.ts').content === 'a\nb\nc\nd\n');
}

{
  const file = 'fn a\nx=10\ny=2\nfn b\nx=10\ny=20\n';
  const op = one(envelope('*** Update File: a.ts', '@@ fn b', del('x=10'), add('x=11')));
  ok(
    '@@ 锚点负责消歧（改的是 fn b 那一段）',
    applyChunksToText(op.chunks, file, 'a.ts').content === 'fn a\nx=10\ny=2\nfn b\nx=11\ny=20\n',
  );
}

{
  const op = one(envelope('*** Update File: a.ts', '@@', ctx('keep'), del('old'), add('new')));
  const applied = applyChunksToText(op.chunks, 'keep\nold\n', 'a.ts');
  ok('上下文行只用于定位，原样保留', applied.content === 'keep\nnew\n' && applied.chunks[0].startLine === 1);
}
ok(
  '文件末尾没有换行时会被补上一个（与 opencode 一致）',
  applyChunksToText(
    one(envelope('*** Update File: a.ts', '@@', del('old'), add('new'))).chunks,
    'old',
    'a.ts',
  ).content === 'new\n',
);
ok(
  '片段里的上下文带后置空行、文件里没有时能兜底匹配',
  applyChunksToText(one(envelope('*** Update File: a.ts', '@@', ctx('a'), add('b'))).chunks, 'a\n', 'a.ts')
    .content === 'a\nb\n',
);

// ── 四级模糊回退 ────────────────────────────────────────────────────────────

{
  const apply = (file, chunkLines) =>
    applyChunksToText(one(envelope('*** Update File: a.ts', '@@', ...chunkLines)).chunks, file, 'a.ts')
      .content;

  ok(
    '一级：精确匹配',
    apply('line1\nline2\nline3\n', [del('line2'), add('changed')]) === 'line1\nchanged\nline3\n',
  );
  ok(
    '二级：文件里那行有尾随空格，补丁里没有',
    apply('line1  \nline2\nline3   \n', [del('line2'), add('changed')]) === 'line1  \nchanged\nline3   \n',
  );
  ok(
    '三级：文件里那行有前导空格，补丁里没有',
    apply('  line1\nline2\n  line3\n', [del('line2'), add('changed')]) === '  line1\nchanged\n  line3\n',
  );
  ok(
    '四级：补丁用 ASCII 引号，文件里是弯引号',
    apply('He said \u201Chello\u201D\nend\n', [del('He said "hello"'), add('He said "hi"')]) ===
      'He said "hi"\nend\n',
  );
  ok(
    '四级：补丁用 ASCII 连字符，文件里是 em dash',
    apply('some\u2014dash\n', [del('some-dash'), add('some-dash changed')]) === 'some-dash changed\n',
  );
}

// ── 对不上时：整体失败（磁盘一个字节都不会动） ───────────────────────────────

throws(
  '上下文对不上时抛错',
  () =>
    applyChunksToText(
      one(envelope('*** Update File: h.ts', '@@', del('nope'), add('nah'))).chunks,
      'a\nb\n',
      'h.ts',
    ),
  '文件没有被修改',
);
throws(
  '错误消息点名文件',
  () =>
    applyChunksToText(
      one(envelope('*** Update File: h.ts', '@@', del('nope'), add('nah'))).chunks,
      'a\n',
      'h.ts',
    ),
  'h.ts',
);
throws(
  '错误消息把那一整段旧文本贴出来',
  () => applyChunksToText(one(envelope('*** Update File: h.ts', '@@', del('nope'))).chunks, 'a\n', 'h.ts'),
  'nope',
);
throws(
  '锚点找不到时单独报错（不是笼统的上下文失败）',
  () =>
    applyChunksToText(
      one(envelope('*** Update File: h.ts', '@@ nowhere', del('a'), add('b'))).chunks,
      'a\n',
      'h.ts',
    ),
  '锚点',
);

// ── 现场回归：模型第一次调用就失败的两种典型写法 ────────────────────────────
//
// 两条都来自真实会话：模型用合法的语法写了、但语义理解与实现不一致，于是第一次必然失败、
// 第二次才改对。这里把它们钉成回归用例。

{
  // ① 把 `@@` 当**标签**用：锚点写的就是本段要改的那一行（unified diff 里 hunk 头那种写法）。
  //    旧实现把搜索起点推到锚点的下一行 → 这一行被锚点吃掉 → 必然报「找不到上下文」。
  const file = 'Line 1: Hello DSH\nLine 2: Foo Bar\nLine 3: Keep\n';
  const op = one(
    envelope(
      '*** Update File: t.txt',
      '@@ Line 1: Hello DSH',
      del('Line 1: Hello DSH'),
      add('Line 1: Hello Patch Tool'),
      '@@ Line 2: Foo Bar',
      del('Line 2: Foo Bar'),
      add('Line 2: Bar Baz'),
    ),
  );
  ok(
    '现场回归①：`@@ 就是本段第一行` 这种写法现在能直接应用',
    applyChunksToText(op.chunks, file, 't.txt').content ===
      'Line 1: Hello Patch Tool\nLine 2: Bar Baz\nLine 3: Keep\n',
  );

  // 锚点真的是**上方**一行时，行为不变（不能因为放宽而改错位置）
  const above = one(
    envelope('*** Update File: t.txt', '@@ Line 1: Hello DSH', del('Line 2: Foo Bar'), add('X')),
  );
  ok(
    '现场回归①：锚点是上方一行时，仍然改它下面那一处',
    applyChunksToText(above.chunks, file, 't.txt').content === 'Line 1: Hello DSH\nX\nLine 3: Keep\n',
  );
}

{
  // ② 模型凭记忆写的那一行与文件**只差几个空格**（第五级：忽略一切空白，但要求唯一）。
  const css = 'body{margin:0}\n  .dashing { animation: dashFlash .18s ease-out; }\n.foot{padding:0}\n';
  const op = one(
    envelope(
      '*** Update File: s.css',
      '@@',
      del('.dashing{animation:dashFlash .18s ease-out;}'),
      add('.dashing{animation:dashFlash .18s ease-out}'),
    ),
  );
  ok(
    '现场回归②：只差空格（少一个 / 位置不同）也能唯一命中',
    applyChunksToText(op.chunks, css, 's.css').content ===
      'body{margin:0}\n.dashing{animation:dashFlash .18s ease-out}\n.foot{padding:0}\n',
  );

  // 同一个「去空白后相同」的行出现两次 → 不安全，必须拒绝（宁可失败也不猜）
  const twice = 'a b\nkeep\na  b\n';
  throws(
    '现场回归②：同类行有两处时拒绝猜测（唯一性安全阀）',
    () => applyChunksToText(one(envelope('*** Update File: t.txt', '@@', del('ab'))).chunks, twice, 't.txt'),
    '文件没有被修改',
  );
}

// ── 失败诊断：错误消息要能把「照抄什么」说清楚 ───────────────────────────────

{
  // 内容差一点（颜色值不同）：消息要点名真实行号、贴出真实内容、并说清差在哪个字符
  const file = 'header\n  .dashing{color:red}\nfooter\n';
  let nearMiss = null;
  try {
    applyChunksToText(
      one(envelope('*** Update File: t.txt', '@@', del('  .dashing{color:green}'))).chunks,
      file,
      't.txt',
    );
  } catch (error) {
    nearMiss = error;
  }
  ok('诊断：报错点名文件里的真实行号', nearMiss !== null && String(nearMiss.message).includes('第 2 行'));
  ok('诊断：报错贴出文件里的真实内容（可照抄）', String(nearMiss?.message).includes('  .dashing{color:red}'));
  ok('诊断：报错说清差在哪个字符', String(nearMiss?.message).includes('个字符起不同'));
  ok('诊断：给出相似度', String(nearMiss?.message).includes('相似度'));

  // 完全不像：老实说「文件里不存在」，并指向 read
  let nowhere = null;
  try {
    applyChunksToText(
      one(envelope('*** Update File: t.txt', '@@', del('这一行根本不存在'))).chunks,
      file,
      't.txt',
    );
  } catch (error) {
    nowhere = error;
  }
  ok('诊断：完全不像时提示先 read（别凭记忆写）', String(nowhere?.message).includes('先 read'));

  // 锚点写错：要点名最像的一行
  let badAnchor = null;
  try {
    applyChunksToText(
      one(envelope('*** Update File: t.txt', '@@ hedder', del('header'), add('H'))).chunks,
      file,
      't.txt',
    );
  } catch (error) {
    badAnchor = error;
  }
  ok('诊断：锚点写错时点名最像的一行', String(badAnchor?.message).includes('第 1 行'));
  ok('诊断：并提醒 @@ 后面是锚点不是标题', String(badAnchor?.message).includes('不是小节标题'));

  // 一个片段里堆了多处**不相邻**的删除：点破「必须连续」这件事
  const spread = 'one\ntwo\nthree\nfour\nfive\n';
  let splitting = null;
  try {
    applyChunksToText(
      one(envelope('*** Update File: t.txt', '@@', del('two'), add('TWO'), del('five'), add('FIVE'))).chunks,
      spread,
      't.txt',
    );
  } catch (error) {
    splitting = error;
  }
  ok('诊断：多处删除不相邻时点破「必须连续」', String(splitting?.message).includes('并不相邻'));
  ok('诊断：并教怎么改（每处单独一个 @@ 片段）', String(splitting?.message).includes('单独写一个'));

  // 锚点命中了、但下面的内容对不上：要把锚点位置与那几行真实内容贴出来
  const file2 = 'alpha\nbeta\ngamma\n';
  let anchorMiss = null;
  try {
    applyChunksToText(
      one(envelope('*** Update File: t.txt', '@@ alpha', del('BETA'), add('B'))).chunks,
      file2,
      't.txt',
    );
  } catch (error) {
    anchorMiss = error;
  }
  ok(
    '诊断：锚点命中但内容对不上时说清锚点在第几行',
    String(anchorMiss?.message).includes('锚点在第 1 行找到了'),
  );
  ok('诊断：并贴出锚点之后的真实内容', String(anchorMiss?.message).includes('alpha'));
}

{
  // 「其实已经改好了」：新内容已在文件里、旧内容不在 → 说清，别让模型接着猜
  let done = null;
  try {
    applyChunksToText(
      one(envelope('*** Update File: t.txt', '@@', del('OLD'), add('NEW'))).chunks,
      'alpha\nNEW\nomega\n',
      't.txt',
    );
  } catch (error) {
    done = error;
  }
  ok('诊断：新内容已在文件里时提示「这段改动已经应用过了」', String(done?.message).includes('已经应用过'));
}

// ── 行尾与统计 ──────────────────────────────────────────────────────────────

ok('CRLF 文件判成 CRLF', detectLineEnding('a\r\nb\r\n') === '\r\n');
ok('LF 文件判成 LF', detectLineEnding('a\nb\n') === '\n');
ok('归一化只吃 \\r\\n 里的 \\r', normalizeLineEndings('a\r\nb\rc\n') === 'a\nb\rc\n');
ok('写回时恢复 CRLF', restoreLineEndings('a\nb\n', '\r\n') === 'a\r\nb\r\n');
ok('LF 原样返回', restoreLineEndings('a\nb\n', '\n') === 'a\nb\n');
{
  // 端到端：CRLF 文件改一行 → 仍然整份 CRLF，不会变成混合行尾。
  const raw = 'alpha\r\nbeta\r\n';
  const op = one(envelope('*** Update File: a.ts', '@@', del('beta'), add('BETA')));
  const applied = applyChunksToText(op.chunks, normalizeLineEndings(raw), 'a.ts');
  ok(
    'CRLF 文件改完仍是整份 CRLF',
    restoreLineEndings(applied.content, detectLineEnding(raw)) === 'alpha\r\nBETA\r\n',
  );
}
ok('逻辑行数：末尾换行不算一行', countLogicalLines('a\nb\n') === 2);
ok('逻辑行数：空文本 0 行', countLogicalLines('') === 0);

// ── previewDiffsOf：流式预览的形状 ──────────────────────────────────────────

{
  const diffs = previewDiffsOf(
    parseApplyPatch(
      envelope(
        '*** Add File: new.txt',
        add('created'),
        '*** Delete File: gone.txt',
        '*** Update File: old.txt',
        '*** Move to: moved.txt',
        '@@',
        del('before'),
        add('after'),
      ),
      { tolerant: true },
    ),
  );
  ok(
    '预览：新建给全 + 内容（oldText 为 null）',
    diffs[0].path === 'new.txt' && diffs[0].oldText === null && diffs[0].newText === 'created',
  );
  ok(
    '预览：删除给空差异（此刻还不知道内容）',
    diffs[1].path === 'gone.txt' && diffs[1].oldText === '' && diffs[1].newText === '',
  );
  ok('预览：改名给新路径 + oldPath', diffs[2].path === 'moved.txt' && diffs[2].oldPath === 'old.txt');
  ok('预览：改名段落的差异两侧都在', diffs[2].oldText === 'before' && diffs[2].newText === 'after');
  ok(
    '预览不带 startLine（落盘后才有确切行号）',
    diffs.every((diff) => diff.startLine === undefined),
  );
}
ok('空补丁预览出空数组', previewDiffsOf(parseApplyPatch('*** Begin Patch\n*** End Patch')).length === 0);

console.log('✓ @dshp/file-change-viewer patch: ' + checks + ' 项断言全部通过');
