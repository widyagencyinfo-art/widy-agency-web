#!/usr/bin/env python3
"""Monta la portada «top» (borrador 26-nov-2026) a partir de la portada publicada.
   Lee de git la portada publicada antes del rediseño (etiqueta portada-antes-26nov), conserva cabecera, pie, metadatos, preguntas,
   opciones de WhatsApp y la franja de fotos con IA, y cambia el resto del <main>.
   Uso (desde la raíz del sitio):  python3 home/_top_build.py
"""
import html, re, subprocess

# La portada y el portafolio de partida son los que había publicados ANTES del rediseño (etiqueta de git).
# No leer de HEAD: HEAD ya contiene la portada nueva.
ORIGEN = "portada-antes-26nov"
import sys
# Dos formas de usarlo:
#  · en la copia publicada (~/pages-webs/widy-agency): sin argumentos; parte de la etiqueta de git.
#  · en la carpeta de origen (~/widy-agency/web): con --archivos; lo llama _build/build_web.py al final y
#    parte de la portada y el portafolio que ese script acaba de generar.
ARCHIVOS = "--archivos" in sys.argv
def original(ruta_git, ruta_archivo):
    if ARCHIVOS:
        t = open(ruta_archivo, encoding="utf-8").read()
        if 'class="tp"' in t or '/trabajos/motovatio"' in t:
            sys.exit(f"{ruta_archivo} ya tiene el diseño nuevo: vuelve a generar la web con _build/build_web.py antes de pasar este script.")
        return t
    return subprocess.run(["git", "show", ORIGEN + ":" + ruta_git], capture_output=True, text=True, check=True).stdout
src = original("index.html", "index.html")
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'
OUT = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>'
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>'
WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>'

# ---------- WhatsApp directo: todos los botones abren el chat con el mensaje ya escrito ----------
from urllib.parse import quote
def wa(texto):
    return "https://wa.me/34624869847?text=" + quote("Hola Widy, te escribo desde widy.agency. " + texto)
WA_BOCETO = wa("Quiero el boceto gratis de mi web.")
WAI = '<svg class="wai" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>'


def limpio(x):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", x))).strip()

# ---------- trabajos: se leen de la portada publicada ----------
trabajos = []
for bloque in re.findall(r'<article class="wk-slide".*?</article>', src, flags=re.S):
    t = limpio(re.search(r"<h3[^>]*>(.*?)</h3>", bloque, re.S).group(1))
    meta = limpio(re.search(r'class="wk-meta"[^>]*>(.*?)</p>', bloque, re.S).group(1))
    estado = limpio(re.search(r'class="wk-status"[^>]*>(.*?)</span>', bloque, re.S).group(1))
    img = re.search(r'<img[^>]*src="([^"]+)"', bloque).group(1)
    barra = re.search(r'class="bbar"[^>]*>.*?<span>(.*?)</span>', bloque, re.S)
    cuerpo = bloque[bloque.index('class="wk-body"'):]
    desc = [limpio(p) for p in re.findall(r"<p(?![^>]*wk-(?:meta|priv))[^>]*>(.*?)</p>", cuerpo, re.S)]
    enlaces = [(h, "wk-link-case" in c) for c, h in re.findall(r'<a class="(wk-link[^"]*)" href="([^"]+)"', bloque)]
    trabajos.append(dict(t=t, meta=meta, estado=estado, img=img, barra=limpio(barra.group(1)) if barra else "",
                         desc=desc[0] if desc else "", enlaces=enlaces))
por_nombre = {w["t"]: w for w in trabajos}
# Casos destacados que eligió Darío (26-nov): La Fleury, Motovatio, La Trattoria, La Tienda de Inés y Lunares del Este.
# Los que no estaban en el carrusel antiguo se definen aquí. La Tienda de Inés solo sale cuando exista su captura
# (home/img/ines-1200.webp): hoy la tienda sigue con contraseña y no se puede enseñar ni enlazar.
import os
por_nombre.update({
    "La Fleury": dict(t="La Fleury", meta="Tienda online · Moda bordada a mano", estado="Web en marcha", img="/home/img/fleury-720.webp", barra="lafleury.com",
                      desc="Tienda online de kimonos, vestidos y cojines bordados a mano. Diseño a medida, con la campaña de la temporada en portada.",
                      enlaces=[("/trabajos/la-fleury", True), ("https://www.lafleury.com", False)]),
    "Motovatio": dict(t="Motovatio", meta="Motos eléctricas · Dos Hermanas (Sevilla)", estado="Web en marcha", img="/home/img/motovatio-720.webp", barra="motovatio.com",
                      desc="Web del espacio de movilidad eléctrica de Grupo PlusAuto: catálogo de motos, scooters y nanocars, y un asistente de WhatsApp que atiende a los interesados y agenda visitas.",
                      enlaces=[("/trabajos/motovatio", True), ("https://motovatio.com", False)]),
    "La Trattoria": dict(t="La Trattoria", meta="Pizzería · O Barco de Valdeorras (Ourense)", estado="Web en marcha", img="/home/img/trattoria-720.webp", barra="latrattoriaobarco.es",
                      desc="Web con la carta y los precios, las fotos de sus pizzas y focaccias de masa madre, y la forma de pedir a domicilio o reservar mesa.",
                      enlaces=[("/trabajos/la-trattoria", True), ("https://latrattoriaobarco.es", False)]),
    "Neza Studios": dict(t="Neza Studios", meta="Marca de ropa · Sevilla", estado="Marca propia", img="/home/img/neza-720.webp", barra="nezastudios.com", txt="Ver la web",
                      desc="Marca de streetwear de dos chavales de Sevilla. Empezó vendiendo con anuncios en Instagram y fue creciendo en redes hasta formar su propia comunidad. Uno de ellos fundó después Widy.",
                      enlaces=[("/trabajos/neza-studios", True), ("https://nezastudios.com", False)]),
    "La Tienda de Inés": dict(t="La Tienda de Inés", meta="Tienda online · Moda de mujer", estado="A punto de abrir", img="/home/img/ines-720.webp", barra="latiendadeines",
                      desc="Tienda online en Shopify con su colección de temporada y sus accesorios.", enlaces=[]),
})
DESTACADOS = ["La Fleury", "Motovatio", "La Trattoria", "La Tienda de Inés", "Neza Studios"]
DESTACADOS = [n for n in DESTACADOS if os.path.exists("." + por_nombre[n]["img"].replace("-720.webp", "-1200.webp"))]

def caso(i, w):
    en_marcha = "marcha" in w["estado"] or "funcionando" in w["estado"]
    ln = ""
    for href, es_caso in w["enlaces"]:
        if es_caso:
            ln += f'<a class="tp-link" href="{href}">Leer el caso<span class="sr-only"> de {html.escape(w["t"])}</span>{ARROW}</a>'
        else:
            txt = w.get("txt") or ("Ver la web en vivo" if en_marcha else "Ver el boceto")
            ln += f'<a class="tp-link" href="{href}" target="_blank" rel="noopener">{txt}<span class="sr-only"> de {html.escape(w["t"])} (se abre en otra pestaña)</span>{OUT}</a>'
    grande = w["img"].replace("-720.webp", "-1200.webp")
    vivo = next((h for h, c in w["enlaces"] if not c), None)
    abre = f'<a class="tp-br" href="{vivo}" target="_blank" rel="noopener" tabindex="-1" data-cur="{"Ver web" if (en_marcha or w.get("txt")) else "Ver boceto"}">' if vivo else '<div class="tp-br">'
    cierra = "</a>" if vivo else "</div>"
    return f'''
      <article class="tp-case" style="--i:{i}" data-r>
        <div class="tp-case-tx">
          <span class="tp-ix">0{i + 1} <i>/ 0{len(DESTACADOS)}</i></span>
          <span class="tp-st{'' if en_marcha else ' b'}"><i></i>{html.escape(w["estado"])}</span>
          <h3>{html.escape(w["t"])}</h3>
          <p class="tp-meta">{html.escape(w["meta"])}</p>
          <p class="tp-d">{html.escape(w["desc"])}</p>
          <div class="tp-case-ln">{ln}</div>
          <a class="tp-case-wa" href="{wa("Quiero una web como la de " + w["t"] + ".")}" target="_blank" rel="noopener">{WAI}Quiero una así</a>
        </div>
        <div class="tp-case-im" aria-hidden="true">
          {abre}<span class="tp-br-bar"><i></i><i></i><i></i><span>{html.escape(w["barra"])}</span></span>
            <img src="{grande}" alt="" width="1200" height="825" loading="lazy" decoding="async">{cierra}
        </div>
      </article>'''

def mini(w):
    href = next((h for h, c in w["enlaces"] if not c), None) or next((h for h, c in w["enlaces"]), None)
    dentro = f'''<span class="tp-th-im"><img src="{w["img"]}" alt="" width="720" height="495" loading="lazy" decoding="async"></span>
          <b>{html.escape(w["t"])}</b><span>{html.escape(w["meta"])} · {html.escape(w["estado"])}</span>'''
    if href:
        ext = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        return f'<a class="tp-th" href="{href}"{ext} draggable="false">{dentro}</a>'
    return f'<div class="tp-th">{dentro}</div>'

casos_html = "".join(caso(i, por_nombre[n]) for i, n in enumerate(DESTACADOS))
resto = [w for w in trabajos if w["t"] not in DESTACADOS]
rail_html = "\n        ".join(mini(w) for w in resto)

# ---------- logos, preguntas, WhatsApp y franja de fotos con IA ----------
logos = []
for srcl, alt in re.findall(r'<li class="pv-logo"[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"', src):
    if alt and (srcl, alt) not in logos:
        logos.append((srcl, alt))
def tira_logos(oculta):
    # Logos en blanco y sin tarjeta, sobre el fondo noche. Los .webp tienen su versión blanca (b-nombre.webp);
    # los .svg se pasan a blanco con un filtro de CSS (clase f).
    def uno(s, a):
        clase = ""
        if s.endswith(".webp"):
            s = s.replace("/clientes/", "/clientes/b-")
        else:
            clase = ' class="f"'
        nombre = s.rsplit("/", 1)[-1].split(".")[0].replace("b-", "")
        return f'<span class="tp-logo l-{nombre}"><img{clase} src="{s}" alt="{"" if oculta else html.escape(a)}" loading="lazy" decoding="async"></span>'
    return "".join(uno(s, a) for s, a in logos)

faq = re.findall(r'<details class="pv-faq-item"><summary>(.*?)<span class="pv-plus"[^>]*></span></summary><div class="pv-faq-a">(.*?)</div></details>', src, flags=re.S)
faq_html = "\n          ".join(f'<details{" open" if i == 0 else ""}><summary>{q.strip()}</summary><div class="tp-an">{a.strip()}</div></details>' for i, (q, a) in enumerate(faq))

opts = re.findall(r'<a class="wa-opt[^"]*" href="([^"]+)"[^>]*>.*?<strong>(.*?)</strong><span>(.*?)</span>', src, flags=re.S)
opts_html = "\n        ".join(
    f'<a class="tp-opt{" first" if i == 0 else ""}" href="{h}" target="_blank" rel="noopener"><span><b>{t}</b><span>{s}</span></span><span class="go">{WA}</span></a>'
    for i, (h, t, s) in enumerate(opts))
wa_duda = re.search(r'href="(https://wa\.me/[^"]+)"[^>]*>[^<]*(?:<[^>]+>)*\s*¿Solo una duda', src)
wa_duda = wa_duda.group(1) if wa_duda else opts[4][0]


# ---------- muro de la portada ----------
M = ["fleury", "motovatio", "trattoria", "neza", "carrusel", "jyc", "kroquetas", "lunares", "plusauto", "bergere", "guaguita", "benditalocura", "pyg"]
def col(nombres):
    una = "".join(f'<span class="tp-shot"><img src="/home/img/m-{n}.webp" alt="" width="420" height="715" decoding="async"></span>' for n in nombres)
    return f'<div class="tp-col">{una}{una}</div>'
muro = col(M[0:4]) + col(M[4:8]) + col(M[8:13])

SECT = [("Moda", "/diseno-web/tienda-de-ropa"), ("Peluquerías", "/diseno-web/peluqueria"), ("Concesionarios", "/pagina-web-para-concesionario"),
        ("Restaurantes", "/diseno-web/restaurante"), ("Reformas", "/diseno-web/empresa-de-reformas")]
def sect(oculta):
    extra = ' tabindex="-1" aria-hidden="true"' if oculta else ""
    return "".join(f'<a href="{h}"{extra}>{n}</a>' for n, h in SECT)


# ---------- los 14 servicios en 4 bloques, cada uno con su demostración ----------
def ico(d):
    return f'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
I = dict(
    web='<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    tienda='<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    reservas='<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    logo='<path d="m4 20 4-1L19 8l-3-3L5 16z"/><path d="m14 7 3 3"/>',
    fotos='<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    redes='<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    video='<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    anuncios='<path d="M4 10v4l10 4V6L4 10z"/><path d="M14 8a4 4 0 0 1 0 8M7 15v4h3"/>',
    maps='<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    google='<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
    whatsapp='<path d="M4 19l1.5-4A7.5 7.5 0 1 1 9 18.5L4 19z"/>',
    llamadas='<path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
    crm='<rect x="4" y="4" width="4.5" height="14" rx="1"/><rect x="10" y="4" width="4.5" height="9" rx="1"/><rect x="16" y="4" width="4.5" height="12" rx="1"/>',
    agentes='<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 16h6"/>',
)
ESC_WEB = """<div class="s-br"><span class="tp-br-bar"><i></i><i></i><i></i><span>motovatio.com</span></span><img src="/home/img/motovatio-1200.webp" alt="" width="1200" height="825" loading="lazy" decoding="async"></div>
            <div class="s-ph"><img src="/home/img/m-fleury.webp" alt="" width="420" height="715" loading="lazy" decoding="async"></div>
            <div class="s-toast t1"><i></i><span>Reserva confirmada<small>Sábado 11:00 · desde tu web</small></span></div>
            <div class="s-toast t2"><i></i><span>Pedido nuevo<small>Desde tu tienda online</small></span></div>"""
ESC_CONT = """<span class="s-post p1"><img src="/home/img/antes.webp" alt="" loading="lazy" decoding="async"><em>En la tienda</em></span>
            <span class="s-post p2"><img src="/home/img/despues.webp" alt="" loading="lazy" decoding="async"><em class="b">Con IA</em></span>
            <span class="s-post p3"><img src="/home/img/m-carrusel.webp" alt="" loading="lazy" decoding="async"><em>Carrusel</em></span>
            <span class="s-post p4"><img src="/home/img/despues.webp" alt="" loading="lazy" decoding="async"><b class="s-play"></b><em>Reel</em></span>"""
ESC_CLI = """<div class="s-goo"><div class="s">peluquería cerca de mí</div><b>Tu negocio</b><div class="s-stars"><i></i><i></i><i></i><i></i><i></i><span>Abierto ahora</span></div><span class="s-tag">Ejemplo · así te verían en Google</span></div>
            <div class="s-ad"><span class="s-ad-h"><i></i><span>Tu negocio<small>Publicidad</small></span></span><img src="/home/img/fleury-720.webp" alt="" loading="lazy" decoding="async"><span class="s-ad-b">Enviar mensaje</span></div>
            <span class="s-pin"><i></i></span>"""
ESC_IA = """<div class="s-chat"><div class="s-b in">¿Tenéis hueco el viernes por la tarde?<small>23:47</small></div><div class="s-typ"><i></i><i></i><i></i></div><div class="s-b out">Sí, a las 17:00 o a las 18:30. ¿Te reservo una?<small>Contestado solo · 23:47</small></div></div>
            <div class="s-crm"><div><em>Nuevos</em><i></i><i></i><i></i></div><div><em>Hablando</em><i class="h"></i><i></i></div><div><em>Con cita</em><i class="h"></i><i></i></div></div>"""
AREAS = [
    ("Web y marca", "Que se te vea bien y se te entienda a la primera.", "web", ESC_WEB,
     [("Páginas web", "/diseno-web", "web"), ("Tiendas online", "/tienda-online", "tienda"), ("Reservas online", "/servicios/reservas-online", "reservas"), ("Logo y marca", "/servicios/logo-y-marca", "logo")]),
    ("Contenido", "Fotos y vídeos de tus productos, listos para publicar.", "cont", ESC_CONT,
     [("Fotos de producto con IA", "/servicios/fotos-producto-ia", "fotos"), ("Carruseles y reels", "/servicios/redes-sociales", "redes"), ("Vídeos y anuncios", "/servicios/video-anuncios", "video")]),
    ("Clientes", "Que quien busca lo que haces en tu zona te encuentre a ti.", "cli", ESC_CLI,
     [("Anuncios en Instagram y Facebook", "/servicios/anuncios-instagram-facebook", "anuncios"), ("Google Maps y reseñas", "/servicios/google-maps-y-resenas", "maps"), ("Salir en Google", "/servicios/seo-local", "google")]),
    ("Inteligencia artificial", "Lo repetitivo, contestado solo. También a las once de la noche.", "ia", ESC_IA,
     [("WhatsApp con IA", "/servicios/whatsapp-ia", "whatsapp"), ("Llamadas con IA", "/servicios/llamadas-ia", "llamadas"), ("CRM y seguimiento", "/servicios/crm-seguimiento", "crm"), ("Agentes de IA para empresas", "/ia", "agentes")]),
]
COLOR = dict(web="#6C9BFF", cont="#FFB547", cli="#3DDC84", ia="#4FD8FF")
serv_html = ""
cinta = []
for ai, (nombre, frase, clave, escena, lista) in enumerate(AREAS):
    cinta += [f'<span class="tp-tk" style="--ac:{COLOR[clave]}">{ico(I[k])}{t}</span>' for t, h, k in lista]
    filas = "".join(f'<li><a href="{h}">{ico(I[k])}<span class="t">{t}</span>{ARROW}</a></li>' for t, h, k in lista)
    pide = wa(f"Me interesa esto: {nombre} ({', '.join(t for t, h, k in lista)}).")
    serv_html += f'''
        <article class="tp-ar ar-{clave}" data-r style="--ac:{COLOR[clave]}">
          <div class="tp-ar-st" aria-hidden="true">
            {escena}
          </div>
          <div class="tp-ar-tx">
            <span class="tp-ar-n" aria-hidden="true">0{ai + 1}</span>
            <p class="tp-area-k">{len(lista)} servicios</p>
            <h3>{nombre}</h3>
            <p class="tp-area-d">{frase}</p>
            <ul class="tp-ar-l">{filas}</ul>
            <a class="tp-ar-wa" href="{pide}" target="_blank" rel="noopener">{WAI}Pedir esto por WhatsApp</a>
          </div>
        </article>'''
cinta_html = ('<div class="tp-ticker" aria-hidden="true">'
              f'<div class="tp-mq"><div class="tp-mq-t">{"".join(cinta[:7]) * 3}</div></div>'
              f'<div class="tp-mq"><div class="tp-mq-t r">{"".join(cinta[7:]) * 3}</div></div></div>')
sect_html = "".join(f'<a href="{h}">{n}</a>' for n, h in SECT)

abribles = len({w['t'] for w in trabajos if w['enlaces']} | {n for n in DESTACADOS if por_nombre[n]['enlaces']})
main = f'''<main id="contenido" class="tp" data-wa="{WA_BOCETO}">
  <div class="tp-intro" aria-hidden="true"><span class="tp-intro-w">Widy<i>.</i></span><span class="tp-intro-n">0</span><span class="tp-intro-bar"><i></i></span></div>
  <script>try{{if(!sessionStorage.getItem("tpIntro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("tp-intro-on")}}catch(e){{}}</script>

  <section class="tp-hero" aria-labelledby="h-title">
    <div class="tp-hero-bg" aria-hidden="true"></div>
    <div class="tp-wrap tp-hero-in">
      <div class="tp-copy">
        <p class="tp-pill" data-r><i></i>Boceto gratis en 48 h</p>
        <h1 class="tp-h1" id="h-title" data-split><span class="tp-kw">Agencia de diseño web e IA en Sevilla</span>Hacemos que tu negocio se vea, <span class="tp-soft">se encuentre y</span> <em class="tp-ser">venda</em> <span class="tp-soft">en internet.</span></h1>
        <p class="tp-sub" data-r style="--d:350">Webs, tiendas online, fotos con IA y un WhatsApp que contesta solo. <strong>Todo en un mismo sitio, y con tu boceto gratis antes de pagar nada.</strong></p>
        <div class="tp-cta" data-r style="--d:450">
          <a href="{WA_BOCETO}" target="_blank" rel="noopener" class="tp-btn tp-btn-main" data-magnet>{WAI}Pide tu boceto gratis</a>
          <a href="#trabajos" class="tp-btn tp-btn-ghost">Ver trabajos</a>
        </div>
        <p class="tp-micro" data-r style="--d:520">Se abre tu WhatsApp con el mensaje ya escrito. Te contestamos hoy mismo.</p>
        <ul class="tp-checks" data-r style="--d:550">
          <li>{CHECK}Gratis y sin compromiso</li>
          <li>{CHECK}En tu WhatsApp en 48 h</li>
          <li>{CHECK}Desde Sevilla, para toda España</li>
        </ul>
      </div>
      <div class="tp-wall" aria-hidden="true" data-r="s" style="--d:300">{muro}</div>
    </div>
    <div class="tp-logos" id="clientes">
      <p>Ya trabajan con nosotros</p>
      <div class="tp-mq"><div class="tp-mq-t">{tira_logos(False)}{tira_logos(True)}{tira_logos(True)}</div></div>
    </div>
  </section>

  <section class="tp-sec tp-dark tp-serv" id="servicios" aria-labelledby="tp-serv-t">
    <div class="tp-wrap">
      <div class="tp-head tp-head-row">
        <div>
          <p class="tp-k">Servicios · 14 en 4 áreas</p>
          <h2 id="tp-serv-t" data-split>Mucho más que hacer webs. <em class="tp-ser">Todo en un mismo sitio.</em></h2>
        </div>
        <p class="tp-lead" data-r>Web, contenido, clientes e inteligencia artificial. Empiezas por lo que más te urge y añades lo demás cuando te haga falta.</p>
      </div>
      {cinta_html}
      <div class="tp-ars" data-stagger>{serv_html}
      </div>
      <div class="tp-serv-foot" data-r>
        <p class="tp-para"><span>Trabajamos con</span>{sect_html}<a href="/diseno-web">Los 28 sectores</a></p>
        <a class="tp-link" href="/servicios">Ver los 14 servicios en detalle {ARROW}</a>
      </div>
    </div>
  </section>

  <section class="tp-sec tp-paper tp-sheet" id="trabajos" aria-labelledby="tp-trab-t">
    <div class="tp-wrap">
      <div class="tp-head tp-head-row">
        <div>
          <p class="tp-k">Trabajos</p>
          <h2 id="tp-trab-t" data-split>Negocios reales. <span class="tp-soft">Webs</span> <em class="tp-ser">reales.</em></h2>
        </div>
        <p class="tp-lead" data-r>Ábrelos: están en vivo. Y debajo, más bocetos que hemos hecho para negocios de toda España.</p>
      </div>
      <div class="tp-cases" data-swipe>{casos_html}
      </div>
      <div class="tp-swipe" aria-hidden="true"><span class="tp-prog" style="--n:{len(DESTACADOS)}"><i></i></span><span class="tp-swipe-t"><b>01</b> / 0{len(DESTACADOS)} · Desliza</span></div>
      <div class="tp-more">
        <div class="tp-more-h"><h3>Más webs y bocetos</h3><span>Desliza →</span></div>
        <div class="tp-rail" data-r data-cur="Arrastra">
        {rail_html}
        </div>
        <p style="margin:18px 0 0"><a class="tp-link" href="/trabajos">Ver el portafolio completo {ARROW}</a></p>
      </div>
    </div>
  </section>

  <section class="tp-nums" id="resultados" aria-label="Resultados">
    <div class="tp-wrap">
      <div class="tp-res">
        <div class="tp-res-tx">
          <p class="tp-k">Caso real · Motovatio</p>
          <h2 class="tp-res-h" data-split>En 12 días, <em class="tp-ser">230 personas</em> preguntaron por una moto.</h2>
          <ul class="tp-res-q" data-r>
            <li><b>La web</b><span>con todas sus motos</span></li>
            <li><b>Los anuncios</b><span>en Instagram y Facebook</span></li>
            <li><b>Un asistente de WhatsApp</b><span>que contesta al momento y da cita</span></li>
          </ul>
          <div class="tp-res-ln" data-r><a class="tp-case-wa" href="{wa("Quiero algo como lo de Motovatio para mi negocio.")}" target="_blank" rel="noopener">{WAI}Quiero esto para mi negocio</a><a class="tp-link" href="/trabajos/motovatio">Leer el caso {ARROW}</a></div>
        </div>
        <div class="tp-res-f" data-r>
          <p class="tp-res-ft">Y esto es lo que pasó</p>
          <ol class="tp-emb">
            <li style="--w:100%"><b><span data-tpn="230">230</span></b><span>personas pidieron información al ver el anuncio</span></li>
            <li style="--w:62%"><b><span data-tpn="142">142</span></b><span>hablaron por WhatsApp con el asistente</span></li>
            <li style="--w:24%"><b><span data-tpn="13">13</span></b><span>quedaron en ir a la tienda a probar la moto</span></li>
          </ol>
          <div class="tp-res-x">
            <div><b><span data-tpn="29">29</span></b><span>escribieron el primer día</span></div>
            <div><b>0,96<small>€</small></b><span>costó cada persona interesada al arrancar</span></div>
          </div>
          <p class="tp-res-n2">Datos del 12 al 23 de noviembre de 2026, del panel de Motovatio y de su cuenta de anuncios.</p>
        </div>
      </div>
      <div class="tp-nums-g" data-r>
        <div class="tp-num"><b><span data-tpn="48">48</span><small>h</small></b><span>y tienes tu boceto en el WhatsApp</span></div>
        <div class="tp-num"><b><span data-tpn="{abribles}">{abribles}</span></b><span>webs y bocetos que puedes abrir ahora mismo</span></div>
        <div class="tp-num"><b><span data-tpn="{len(logos)}">{len(logos)}</span></b><span>negocios que ya trabajan con nosotros</span></div>
        <div class="tp-num"><b><span data-tpn="0">0</span><small>€</small></b><span>por ver cómo quedaría la tuya</span></div>
      </div>
    </div>
  </section>

  <section class="tp-sec tp-paper tp-sheet" id="como" aria-labelledby="tp-como-t">
    <div class="tp-wrap">
      <div class="tp-head">
        <p class="tp-k">Cómo trabajamos</p>
        <h2 id="tp-como-t" data-split>Primero lo <em class="tp-ser">ves.</em> Luego decides. <span class="tp-soft">Nunca al revés.</span></h2>
      </div>
      <div class="tp-steps" data-stagger>
        <div class="tp-line" aria-hidden="true"><i></i></div>
        <div class="tp-step" data-r><h3>Nos escribes</h3><p>Por WhatsApp, en dos minutos. Nos cuentas tu negocio y lo que te hace falta.</p></div>
        <div class="tp-step" data-r><h3>Ves tu boceto</h3><p>En 48 horas y gratis, hecho con tus fotos y tus datos. Sin compromiso.</p></div>
        <div class="tp-step" data-r><h3>Precio cerrado</h3><p>Por escrito, antes de empezar: qué incluye, cuánto cuesta y cuándo se paga. Tú decides.</p></div>
        <div class="tp-step" data-r><h3>Lo montamos y lo cuidamos</h3><p>Lo dejamos funcionando y nos sigues teniendo para cambios y dudas.</p></div>
      </div>
      <p class="tp-note" data-r>La mitad al empezar y la otra mitad con todo listo. ¿Una referencia? Mira <a href="/cuanto-cuesta-una-pagina-web">cuánto cuesta una página web en España</a>.</p>
    </div>
  </section>

  <section class="tp-sec tp-dark" id="sobre-mi" aria-labelledby="tp-sobre-t">
    <div class="tp-wrap tp-about">
      <figure class="tp-photo" data-r="s" style="margin:0">
        <img src="/home/img/dario-escenario.webp" alt="Darío Pulido, fundador de Widy" width="1200" height="1500" loading="lazy" decoding="async">
        <figcaption><b>Darío Pulido</b><span>Fundador de Widy · Sevilla</span></figcaption>
      </figure>
      <div>
        <p class="tp-k">Quiénes somos</p>
        <h2 id="tp-sobre-t" data-split>Somos Widy. <span class="tp-soft">Todo en</span> <em class="tp-ser">un mismo sitio.</em></h2>
        <p class="tp-lead" data-r>Un estudio de diseño web e IA en Sevilla, fundado por Darío Pulido. Web, tienda, contenido y clientes, sin tener que coordinar a cinco proveedores.</p>
        <ul class="tp-ticks" data-stagger>
          <li data-r><span><b>Primero ves, luego decides.</b> El boceto es gratis.</span></li>
          <li data-r><span><b>Un solo contacto</b> para todo, por WhatsApp.</span></li>
          <li data-r><span><b>Todo es tuyo:</b> el dominio, las fotos y los textos.</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="tp-sec tp-sheet" id="faq" aria-labelledby="tp-faq-t">
    <div class="tp-wrap tp-faq">
      <div class="tp-head">
        <p class="tp-k">Preguntas</p>
        <h2 id="tp-faq-t" data-split>Lo que nos preguntarías <em class="tp-ser">por WhatsApp.</em></h2>
        <p class="tp-lead" data-r>¿No está tu pregunta? Escríbenos y te contestamos, normalmente el mismo día.</p>
        <p style="margin:26px 0 0" data-r><a class="tp-btn tp-btn-line" href="{wa_duda}" target="_blank" rel="noopener">Preguntar por WhatsApp {ARROW}</a></p>
      </div>
      <div class="tp-qa" data-r>
          {faq_html}
      </div>
    </div>
  </section>

  <div class="tp-tape" aria-hidden="true"><div class="tp-mq-t"><span>Boceto gratis en 48 h</span><span>Primero lo ves</span><span>Luego decides</span><span>Sin compromiso</span><span>Boceto gratis en 48 h</span><span>Primero lo ves</span><span>Luego decides</span><span>Sin compromiso</span><span>Boceto gratis en 48 h</span><span>Primero lo ves</span><span>Luego decides</span><span>Sin compromiso</span><span>Boceto gratis en 48 h</span><span>Primero lo ves</span><span>Luego decides</span><span>Sin compromiso</span></div></div>

  <section class="tp-end" id="boceto" aria-labelledby="tp-end-t">
    <div class="tp-hero-bg" aria-hidden="true"></div>
    <div class="tp-wrap">
      <p class="tp-k" style="color:var(--sky)">Sin compromiso</p>
      <h2 class="tp-end-h" id="tp-end-t" data-split>Cuéntanos tu negocio. En 48 h tienes el boceto <em class="tp-ser">en tu WhatsApp.</em></h2>
      <p class="tp-lead" data-r style="color:#B4C2E6">Sin formularios: toca lo que buscas y se abre tu WhatsApp con el mensaje ya escrito. Te contesta una persona, nada de bots ni centralitas.</p>
      <div class="tp-opts" data-stagger data-origen="widy.agency">
        {opts_html}
      </div>
      <div class="tp-end-foot" data-r>
        <span>¿Prefieres hablar? <a href="tel:+34624869847">Llámanos al 624 86 98 47</a></span>
        <span>Si no te convence, no nos debes nada.</span>
      </div>
    </div>
    <div class="tp-big" aria-hidden="true"><span>Widy<i>.</i></span></div>
  </section>
</main>'''

# las opciones de WhatsApp entran en cascada
main = main.replace('<a class="tp-opt', '<a data-r class="tp-opt')

ini, fin = src.index("<main"), src.index("</main>") + len("</main>")
nuevo = src[:ini] + main + src[fin:]
nuevo = re.sub(r'<a href="#boceto" class="(btn btn-primary[^"]*)"', lambda m: f'<a href="{WA_BOCETO}" target="_blank" rel="noopener" class="{m.group(1)}"', nuevo)
nuevo = nuevo.replace('<link rel="stylesheet" href="/home/portada.css">', '<link rel="stylesheet" href="/home/portada.css">\n<link rel="stylesheet" href="/home/top.css">', 1)
nuevo = nuevo.replace('<script src="/home/portada.js" defer></script>', '<script src="/home/portada.js" defer></script>\n<script src="/home/top.js" defer></script>', 1)
assert "/home/top.css" in nuevo and "/home/top.js" in nuevo
sys.path.insert(0, "home"); import _wv_intro; nuevo = _wv_intro.aplicar(nuevo)  # intro en vídeo (26-nov)
open("index.html", "w").write(nuevo)
print("portada montada:", len(trabajos), "trabajos,", len(logos), "logos,", len(faq), "preguntas,", len(opts), "opciones de WhatsApp")


# ================= páginas de caso (diseño nuevo) =================
CASOS = {
    "motovatio": dict(
        nombre="Motovatio", titulo="Motovatio: 230 contactos en 12 días con anuncios y WhatsApp con IA · Widy",
        desc="Caso Motovatio (Grupo PlusAuto, Dos Hermanas): web, anuncios en Instagram y Facebook y un asistente de WhatsApp que contesta y agenda visitas. 230 contactos en 12 días.",
        meta="Motos eléctricas · Dos Hermanas (Sevilla)", estado="Web en marcha", url="https://motovatio.com", dominio="motovatio.com",
        img="motovatio", cliente="Grupo PlusAuto", sector="Movilidad eléctrica", areas="Web · Anuncios · WhatsApp con IA", fecha="2026",
        entrada="Web, anuncios y un asistente de WhatsApp para que la gente vaya a probar las motos.",
        partida="Grupo PlusAuto abrió en Dos Hermanas un espacio solo de movilidad eléctrica: motos, scooters, ciclomotores y nanocars. Hacía falta que la gente de la zona lo conociera, preguntara sin compromiso y, sobre todo, se acercara a probarlas.",
        hecho=[("La web", "motovatio.com, con el catálogo de motos, scooters y nanocars, comparador y botón de WhatsApp en cada pantalla."),
               ("Los anuncios", "Campaña en Instagram y Facebook para Sevilla, Cádiz y Huelva, con un formulario de una sola pregunta para que escribir cueste lo mínimo."),
               ("El asistente de WhatsApp", "Contesta en un par de minutos a cada persona, resuelve las dudas de siempre (carnet, ayudas, carga) y propone día y hora para ir a probar la moto."),
               ("El panel del equipo", "Todas las conversaciones, las visitas apuntadas y los avisos de a quién hay que llamar hoy, en una sola pantalla.")],
        cifras=[("230", "personas pidieron información en 12 días"), ("29", "escribieron el primer día"), ("142", "hablaron por WhatsApp con el asistente"), ("13", "quedaron en ir a la tienda a probar la moto"), ("0,96 €", "costó cada persona interesada al arrancar")],
        nota="Datos del 12 al 23 de noviembre de 2026, sacados del panel del cliente y de la cuenta de anuncios. El coste por contacto es el de las primeras horas de campaña."),
    "la-fleury": dict(
        nombre="La Fleury", titulo="La Fleury: tienda online de moda bordada a mano · Widy",
        desc="Caso La Fleury: tienda online a medida para una marca de kimonos, vestidos y cojines bordados a mano.",
        meta="Tienda online · Moda bordada a mano", estado="Web en marcha", url="https://www.lafleury.com", dominio="lafleury.com",
        img="fleury", cliente="La Fleury", sector="Moda", areas="Tienda online · Contenido", fecha="2026",
        entrada="Una tienda online a la altura de unas piezas bordadas a mano.",
        partida="La Fleury hace kimonos, vestidos y cojines bordados a mano. Ya vendía por internet, pero la tienda no transmitía lo que valen sus piezas ni contaba la historia de cada colección.",
        hecho=[("Diseño a medida", "Tienda nueva en Shopify, pensada para que las prendas manden: fotos grandes, poco texto y la campaña de la temporada en portada."),
               ("Colecciones ordenadas", "Cada colección con su página y sus colores, para que comprar sea fácil desde el móvil."),
               ("En dos idiomas", "La tienda se ve en inglés o en español según quién entra."),
               ("Fotos de producto", "Fotos limpias de cada prenda para la ficha y para redes.")],
        galeria=[("fleury-new", "lafleury.com/collections/new-in", "La colección nueva, ordenada para comprar"),
                 ("fleury-prod", "lafleury.com/products/imagine-pouch", "La ficha de cada pieza, con sus colores")],
        galeria_m=("m-fleury-prod", "Y así se ve en el móvil"),
        cifras=[], nota=""),
    "la-trattoria": dict(
        nombre="La Trattoria", titulo="La Trattoria: la web de una pizzería con carta, pedidos y reservas · Widy",
        desc="Caso La Trattoria (O Barco de Valdeorras): web con la carta y los precios, fotos reales, pedidos por teléfono y reserva de mesa por WhatsApp.",
        meta="Pizzería · O Barco de Valdeorras (Ourense)", estado="Web en marcha", url="https://latrattoriaobarco.es", dominio="latrattoriaobarco.es",
        img="trattoria", cliente="La Trattoria", sector="Restauración", areas="Página web · Reservas", fecha="2026",
        entrada="La carta, las fotos y la forma de pedir o reservar, en una web que se usa con una mano.",
        partida="La Trattoria hace pizzas y focaccias de masa madre en el casco antiguo de O Barco. No tenía web: quien la buscaba en Google no veía la carta ni los precios, y los pedidos entraban solo por teléfono.",
        hecho=[("La carta con precios", "Toda la carta en la web, ordenada y fácil de leer en el móvil."),
               ("Fotos reales", "Las pizzas, las focaccias y el local, con fotos suyas."),
               ("Reservar en 30 segundos", "El cliente elige cuántos son, el día y la hora, y le sale el mensaje ya escrito para WhatsApp."),
               ("Pedir sin líos", "Botón de llamar siempre a mano y aviso de si está abierto o a qué hora abre."),
               ("Dominio propio", "latrattoriaobarco.es, a su nombre.")],
        cifras=[], nota=""),
    "neza-studios": dict(
        nombre="Neza Studios", titulo="Neza Studios: una marca de ropa de Sevilla hecha con anuncios y redes · Widy",
        desc="Caso Neza Studios: marca de streetwear de dos chavales de Sevilla. Marca, anuncios en Instagram, redes y web con lista de espera para el próximo drop.",
        meta="Marca de ropa · Sevilla", estado="Marca propia", url="https://nezastudios.com", dominio="nezastudios.com", ver="Ver la web",
        img="neza", cliente="Neza Studios", sector="Moda · Streetwear", areas="Marca · Anuncios · Redes · Web", fecha="Próximo drop: junio de 2027",
        entrada="La marca con la que empezó todo: dos chavales de Sevilla, anuncios en Instagram y una comunidad detrás.",
        partida="Neza Studios nació en Sevilla como la marca de streetwear de dos amigos, sin tienda física ni un gran presupuesto detrás. Había que darla a conocer desde cero y vender por internet. Uno de ellos fundó después Widy: lo que hoy hacemos para otros negocios lo aprendimos primero aquí.",
        hecho=[("La marca", "Nombre, logo e identidad propia: streetwear con raíz del sur, «From the South»."),
               ("Los anuncios", "Campañas en Instagram para enseñar las prendas a gente que no conocía la marca y llevarla a la tienda online."),
               ("Las redes", "Contenido constante en Instagram y TikTok hasta formar una comunidad alrededor de la marca."),
               ("La web", "nezastudios.com, con cuenta atrás y lista de espera para avisar del próximo drop."),
               ("Los eventos", "Porra en directo y sorteo de camisetas en una terraza de Sevilla, con el marcador en pantalla y carteles con QR.")],
        cifras=[], nota=""),
}
def pagina_caso(slug, c, sig_slug, sig):
    quiero = wa(f"Quiero una web como la de {c['nombre']}.")
    hecho = "".join(f'<li data-r><b>{t}</b><span>{d}</span></li>' for t, d in c["hecho"])
    cifras = ""
    if c["cifras"]:
        celdas = "".join(f'<div><b>{n}</b><span>{t}</span></div>' for n, t in c["cifras"])
        cifras = f"""
  <section class="tp-sec tp-dark tp-cs-res" aria-labelledby="cs-res-t">
    <div class="tp-wrap">
      <p class="tp-k">El resultado</p>
      <h2 id="cs-res-t" data-split>Lo que pasó <em class="tp-ser">después.</em></h2>
      <div class="tp-cs-g" data-r>{celdas}</div>
      <p class="tp-cs-nota" data-r>{c["nota"]}</p>
    </div>
  </section>"""
    galeria = ""
    if c.get("galeria"):
        marcos = "".join(f'''<figure data-r><div class="tp-br"><span class="tp-br-bar"><i></i><i></i><i></i><span>{u}</span></span><img src="/home/img/{g}.webp" alt="{html.escape(t)}" width="1200" height="825" loading="lazy" decoding="async"></div><figcaption>{t}</figcaption></figure>''' for g, u, t in c["galeria"])
        movil = ""
        if c.get("galeria_m"):
            g, t = c["galeria_m"]
            movil = f'<figure class="m" data-r><div class="tp-cs-ph2"><img src="/home/img/{g}.webp" alt="{html.escape(t)}" width="420" height="715" loading="lazy" decoding="async"></div><figcaption>{t}</figcaption></figure>'
        galeria = f"""
  <section class="tp-sec tp-paper tp-cs-gal" aria-label="La tienda por dentro">
    <div class="tp-wrap">
      <p class="tp-k">Por dentro</p>
      <h2 data-split>Así ha <em class="tp-ser">quedado.</em></h2>
      <div class="tp-cs-gg{' con-m' if movil else ''}" data-stagger>{marcos}{movil}</div>
    </div>
  </section>"""
    cuerpo = f"""<main id="contenido" class="tp tp-cs" data-wa="{WA_BOCETO}">
  <section class="tp-hero tp-cs-hero" aria-labelledby="h-title">
    <div class="tp-hero-bg" aria-hidden="true"></div>
    <div class="tp-wrap">
      <p class="tp-cs-miga" data-r><a href="/trabajos">Trabajos</a><span>/</span>{c["nombre"]}</p>
      <span class="tp-st{'' if 'marcha' in c['estado'] else ' b'}" data-r><i></i>{c["estado"]}</span>
      <h1 class="tp-h1" id="h-title" data-split>{c["nombre"]}</h1>
      <p class="tp-sub" data-r style="--d:200">{c["entrada"]}</p>
      <div class="tp-cta" data-r style="--d:300">
        <a href="{quiero}" target="_blank" rel="noopener" class="tp-btn tp-btn-main" data-magnet>{WAI}Quiero una así</a>
        <a href="{c["url"]}" target="_blank" rel="noopener" class="tp-btn tp-btn-ghost">{c.get("ver", "Ver la web en vivo")} {OUT}</a>
      </div>
      <dl class="tp-cs-f" data-r style="--d:380">
        <div><dt>Cliente</dt><dd>{c["cliente"]}</dd></div>
        <div><dt>Sector</dt><dd>{c["sector"]}</dd></div>
        <div><dt>Qué hicimos</dt><dd>{c["areas"]}</dd></div>
        <div><dt>Cuándo</dt><dd>{c["fecha"]}</dd></div>
      </dl>
      <div class="tp-cs-shot" data-r="s" style="--d:300" aria-hidden="true">
        <a class="tp-br" href="{c["url"]}" target="_blank" rel="noopener" tabindex="-1" data-cur="Ver web"><span class="tp-br-bar"><i></i><i></i><i></i><span>{c["dominio"]}</span></span>
          <img src="/home/img/{c["img"]}-1200.webp" alt="" width="1200" height="825" decoding="async"></a>
        <div class="tp-cs-ph"><img src="/home/img/m-{c["img"]}.webp" alt="" width="420" height="715" decoding="async"></div>
      </div>
    </div>
  </section>

  <section class="tp-sec tp-cs-body">
    <div class="tp-wrap tp-cs-cols">
      <div>
        <p class="tp-k">El punto de partida</p>
        <h2 data-split>De dónde <em class="tp-ser">veníamos.</em></h2>
        <p class="tp-lead" data-r>{c["partida"]}</p>
      </div>
      <div>
        <p class="tp-k">Lo que hicimos</p>
        <ul class="tp-cs-l" data-stagger>{hecho}</ul>
      </div>
    </div>
  </section>
{galeria}{cifras}
  <section class="tp-end" id="boceto" aria-labelledby="cs-end-t">
    <div class="tp-hero-bg" aria-hidden="true"></div>
    <div class="tp-wrap">
      <p class="tp-k" style="color:var(--sky)">Tu turno</p>
      <h2 class="tp-end-h" id="cs-end-t" data-split>¿Hacemos <em class="tp-ser">la tuya?</em></h2>
      <p class="tp-lead" data-r style="color:#B4C2E6">Cuéntanos tu negocio por WhatsApp. En 48 horas ves tu boceto, hecho con tus fotos y tus datos, y sin pagar nada.</p>
      <div class="tp-cta" data-r>
        <a href="{quiero}" target="_blank" rel="noopener" class="tp-btn tp-btn-main" data-magnet>{WAI}Quiero una así</a>
        <a href="/trabajos/{sig_slug}" class="tp-btn tp-btn-ghost">Siguiente caso: {sig["nombre"]} {ARROW}</a>
      </div>
    </div>
    <div class="tp-big" aria-hidden="true"><span>Widy<i>.</i></span></div>
  </section>
</main>"""
    html_ = nuevo[:nuevo.index("<main")] + cuerpo + nuevo[nuevo.index("</main>") + len("</main>"):]
    url = f"https://widy.agency/trabajos/{slug}"
    html_ = re.sub(r"<title>.*?</title>", f"<title>{html.escape(c['titulo'])}</title>", html_, count=1, flags=re.S)
    html_ = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + html.escape(c["desc"], quote=True), html_, count=1)
    html_ = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, html_, count=1)
    html_ = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, html_, count=1)
    html_ = re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*', lambda m: m.group(1) + html.escape(c["titulo"], quote=True), html_)
    html_ = re.sub(r'(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*', lambda m: m.group(1) + html.escape(c["desc"], quote=True), html_)
    html_ = re.sub(r'<script type="application/ld\+json">.*?</script>\s*', "", html_, flags=re.S)
    html_ = re.sub(r'<script src="/js/newsletter\.js"[^>]*></script>\s*', "", html_)  # en un caso no salta la ventana de la newsletter
    open(f"trabajos/{slug}.html", "w").write(html_)
slugs = list(CASOS)
for i, sl in enumerate(slugs):
    sig = slugs[(i + 1) % len(slugs)]
    pagina_caso(sl, CASOS[sl], sig, CASOS[sig])
print("casos:", ", ".join(slugs))

# ================= portafolio (/trabajos): los 4 casos nuevos van los primeros =================
RES = {"motovatio": "Web, anuncios y WhatsApp con IA · 230 contactos en 12 días", "la-fleury": "Tienda online a medida y fotos de producto",
       "la-trattoria": "Web con carta, pedidos y reservas", "neza-studios": "Marca, anuncios, redes y web"}
tr = original("trabajos.html", "trabajos/index.html")
tarjetas = ""
for sl, c in CASOS.items():
    tarjetas += f'''<a class="cs-card reveal" href="/trabajos/{sl}">
          <span class="wk-shot"><span class="bbar" aria-hidden="true"><i></i><i></i><i></i><span>{c["dominio"]}</span></span><img src="/home/img/{c["img"]}-1200.webp" alt="{html.escape(c["nombre"])}" width="1200" height="825" loading="lazy"></span>
          <span class="cs-body"><span class="cs-meta">{c["meta"]}</span><strong>{c["nombre"]}</strong><span class="cs-sum">{RES[sl]}</span><span class="cs-go">Leer el caso {ARROW}</span></span>
        </a>
        '''
ancla = '<div class="cs-grid">'
assert ancla in tr
tr = tr.replace(ancla, ancla + "\n        " + tarjetas, 1)
open("trabajos/index.html", "w").write(tr)
if not ARCHIVOS or os.path.exists("trabajos.html"):
    open("trabajos.html", "w").write(tr)
print("portafolio: 4 casos nuevos añadidos")

# mapa del sitio: los 4 casos nuevos
if os.path.exists("sitemap.xml"):
    sm = open("sitemap.xml", encoding="utf-8").read()
    extra = "".join(f'\n  <url><loc>https://widy.agency/trabajos/{sl}</loc><lastmod>2026-11-26</lastmod><priority>0.7</priority></url>'
                    for sl in CASOS if f"/trabajos/{sl}<" not in sm)
    if extra:
        open("sitemap.xml", "w").write(sm.replace("</urlset>", extra.lstrip("\n") + "\n</urlset>") if "\n</urlset>" not in sm else sm.replace("\n</urlset>", extra + "\n</urlset>"))
        print("sitemap: casos añadidos")
