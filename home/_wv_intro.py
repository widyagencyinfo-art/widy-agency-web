"""Intro en vídeo de la portada (cintas que forman la W, 26-nov-2026).
_top_build.py la aplica justo antes de escribir index.html, para que no se pierda al regenerar la portada.
Los bloques HTML están en home/_wv_intro.json (intro + fondo de cintas de la cabecera + selector ordenador/móvil).
"""
import json, os

_B = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "_wv_intro.json"), encoding="utf-8"))

def aplicar(html):
    if "wv-intro" in html:
        return html
    # quitar la intro vieja («Widy.» con contador) y poner la de vídeo
    a = html.find('<div class="tp-intro"')
    if a >= 0:
        b = html.find("</script>", a) + len("</script>")
        html = html[:a] + _B["intro"] + html[b:]
    else:
        m = html.find('<main id="contenido"')
        m = html.find(">", m) + 1
        html = html[:m] + "\n  " + _B["intro"] + html[m:]
    # fondo de cintas en la PRIMERA cabecera (la de arriba)
    html = html.replace('<div class="tp-hero-bg" aria-hidden="true"></div>', _B["bg"], 1)
    # elegir versión de ordenador o de móvil
    html = html.replace("</body>", _B["sel"] + "\n</body>", 1)
    return html
