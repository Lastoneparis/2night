#!/usr/bin/env python3
"""
Insert the `waitlist_done` key into every language block of js/translations.js.

It is added immediately after each `"waitlist_button": "..."` line, preserving
that block's indentation. Idempotent: if waitlist_done already exists in the
file it refuses to run (so re-running won't duplicate).

Native translation of the EN string:
    "You're on the list. See you tonight."
Brand nouns (2NIGHT) stay English; here there are none in the string.
"""
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.normpath(os.path.join(HERE, "..", "js", "translations.js"))

# Order MUST match the order of language blocks in translations.js:
# en, fr, de, es, it, pt, nl, pl, ru, uk, cs, ro, hu, sv, nb, da, fi, el, tr,
# ar, he, ja, zh-Hans, zh-Hant, ko, th, vi, id, ms, hi, bn, ur, sw, pt-BR
DONE = [
    "You're on the list. See you tonight.",                       # en
    "Vous êtes sur la liste. À ce soir.",                          # fr
    "Du stehst auf der Liste. Bis heute Abend.",                   # de
    "Estás en la lista. Nos vemos esta noche.",                    # es
    "Sei in lista. A stasera.",                                    # it
    "Estás na lista. Até logo à noite.",                           # pt
    "Je staat op de lijst. Tot vanavond.",                         # nl
    "Jesteś na liście. Do zobaczenia wieczorem.",                  # pl
    "Вы в списке. До встречи вечером.",                            # ru
    "Ви в списку. До зустрічі ввечері.",                           # uk
    "Jsi na seznamu. Uvidíme se večer.",                           # cs
    "Ești pe listă. Ne vedem diseară.",                            # ro
    "Felkerültél a listára. Találkozunk ma este.",                 # hu
    "Du står på listan. Vi ses i kväll.",                          # sv
    "Du er på listen. Vi ses i kveld.",                            # nb
    "Du er på listen. Vi ses i aften.",                            # da
    "Olet listalla. Nähdään tänä iltana.",                         # fi
    "Είσαι στη λίστα. Τα λέμε απόψε.",                              # el
    "Listedesin. Bu gece görüşürüz.",                              # tr
    "أنت على القائمة. نراك الليلة.",                               # ar
    "אתם ברשימה. נתראה הערב.",                                      # he
    "リストに登録しました。今夜会いましょう。",                      # ja
    "你已加入名单。今晚见。",                                        # zh-Hans
    "你已加入名單。今晚見。",                                        # zh-Hant
    "명단에 등록됐어요. 오늘 밤에 만나요.",                          # ko
    "คุณอยู่ในลิสต์แล้ว แล้วเจอกันคืนนี้",                          # th
    "Bạn đã có trong danh sách. Hẹn gặp tối nay.",                 # vi
    "Kamu sudah masuk daftar. Sampai jumpa malam ini.",            # id
    "Anda kini dalam senarai. Jumpa malam ini.",                   # ms
    "आप सूची में हैं। आज रात मिलते हैं।",                           # hi
    "আপনি তালিকায় আছেন। আজ রাতে দেখা হবে।",                        # bn
    "آپ فہرست میں شامل ہیں۔ آج رات ملتے ہیں۔",                      # ur
    "Uko kwenye orodha. Tutaonana usiku huu.",                     # sw
    "Você está na lista. Até hoje à noite.",                       # pt-BR
]


def esc(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main():
    with io.open(PATH, "r", encoding="utf-8") as f:
        text = f.read()

    if '"waitlist_done"' in text:
        sys.exit("waitlist_done already present; aborting to avoid duplicates")

    lines = text.split("\n")
    out = []
    idx = 0
    for line in lines:
        out.append(line)
        m = re.match(r'^(\s*)"waitlist_button":', line)
        if m:
            if idx >= len(DONE):
                sys.exit("more waitlist_button lines than translations provided")
            indent = m.group(1)
            out.append('%s"waitlist_done": "%s",' % (indent, esc(DONE[idx])))
            idx += 1

    if idx != len(DONE):
        sys.exit("expected %d blocks, matched %d" % (len(DONE), idx))

    with io.open(PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print("inserted waitlist_done into %d language blocks" % idx)


if __name__ == "__main__":
    main()
