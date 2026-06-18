#!/usr/bin/env python3
"""
GlitchTip 中文翻译维护助手（在仓库根目录运行）。

跟上游同步后（git merge upstream/master），前端可能新增/改了界面文案。本脚本：
  1) extract —— 对比本地 src/locale/messages.xlf 与现有翻译，
                找出还没翻的条目，生成 zh-l10n/to-translate-new.json，并列出已废弃条目；
  2) merge   —— 把翻好的 zh-l10n/translated-new.json 合并进 src/assets/i18n/messages.zh.json。

翻译 ID 是按"原文内容"生成的：原文没变 ID 不变(译文自动保留)，原文一改 ID 就变(当作新条目)。

用法（仓库根目录）：
  python3 zh-l10n/update-translation.py extract
  # 把 zh-l10n/to-translate-new.json 按 zh-l10n/translation-prompt.md 的提示词交给 AI 翻译，
  # 结果存成 zh-l10n/translated-new.json，然后：
  python3 zh-l10n/update-translation.py merge
"""
import json, re, html, sys

XLF = "src/locale/messages.xlf"                  # 同步上游后本地就是最新的
ZH_JSON = "src/assets/i18n/messages.zh.json"     # 中文翻译（运行时直接用的格式）
TODO = "zh-l10n/to-translate-new.json"
DONE = "zh-l10n/translated-new.json"


def flatten(src: str) -> str:
    """把 XLIFF 源串里的 <ph>/<pc> 占位符压平成 {$NAME} 文本 token。"""
    src = re.sub(r'<ph\b[^>]*?\bequiv="([^"]+)"[^>]*?/>', r'{$\1}', src)
    pat = re.compile(
        r'<pc\b[^>]*?\bequivStart="(?P<a>[^"]+)"[^>]*?\bequivEnd="(?P<b>[^"]+)"[^>]*?>(?P<inner>.*?)</pc>',
        re.S,
    )
    while pat.search(src):
        src = pat.sub(lambda m: "{$" + m["a"] + "}" + m["inner"] + "{$" + m["b"] + "}", src)
    return html.unescape(re.sub(r"\s+", " ", src).strip())


def parse_xlf(text: str) -> dict:
    units = re.findall(r'<unit id="([^"]+)">.*?<source>(.*?)</source>', text, re.S)
    return {uid: flatten(src) for uid, src in units}


def load(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def extract():
    new_src = parse_xlf(open(XLF, encoding="utf-8").read())
    existing = load(ZH_JSON)
    todo = {uid: s for uid, s in new_src.items() if uid not in existing}
    obsolete = [uid for uid in existing if uid not in new_src]
    with open(TODO, "w", encoding="utf-8") as f:
        json.dump(todo, f, ensure_ascii=False, indent=1)
    print(f"新版条目: {len(new_src)}   已翻译: {len(existing)}")
    print(f"需要新翻: {len(todo)}  ->  {TODO}")
    print(f"已废弃(新版不再使用，可忽略): {len(obsolete)}")
    if todo:
        print(f"\n把 {TODO} 交给 AI 翻译，结果存成 {DONE}，再运行：")
        print("  python3 zh-l10n/update-translation.py merge")
    else:
        print("\n没有新增条目，无需翻译。")


def merge():
    existing = load(ZH_JSON)
    new = load(DONE)
    before = len(existing)
    existing.update(new)
    with open(ZH_JSON, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=1)
    print(f"合并完成：{before} -> {len(existing)} 条（新增 {len(existing) - before}）")
    print(f"已写回 {ZH_JSON}，提交并重新构建镜像即可。")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "extract":
        extract()
    elif cmd == "merge":
        merge()
    else:
        print(__doc__)
        sys.exit(1)
