/*
  Script comune di apps.abysstech.it. Va incluso nel <head>, senza defer:
    <script src="/assets/site.js"></script>

  1. Lingua. Le pagine contengono italiano e inglese; si mostra una lingua sola.
     Gli elementi con class="lang" e lang="it" / lang="en" sono visibili solo nella lingua attiva.
     Ordine di scelta: #it / #en nell'indirizzo (link diretti), poi la scelta salvata con il selettore,
     poi le lingue del browser (italiano se è l'italiano a comparire prima dell'inglese, altrimenti inglese).
     Titolo per lingua: attributi data-title-it e data-title-en su <html>.
     Senza JavaScript si vedono entrambe le lingue, una sotto l'altra.

  2. Email protetta. L'indirizzo non compare in chiaro nel codice della pagina:
       <a class="email" data-mail="BASE64" data-subject="Oggetto facoltativo">testo senza JavaScript</a>
     data-mail è l'indirizzo codificato in Base64 (python3 -c "import base64;print(base64.b64encode(b'nome@dominio.it').decode())").
     Lo script crea il link mailto: e scrive l'indirizzo come testo.
*/
(function () {
  var root = document.documentElement;
  var KEY = 'lang';

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }
  function valid(lang) {
    return lang === 'it' || lang === 'en';
  }
  function fromBrowser() {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).slice(0, 2).toLowerCase();
      if (valid(code)) return code;
    }
    return 'en';
  }

  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    var title = root.getAttribute('data-title-' + lang);
    if (title) document.title = title;
    var links = document.querySelectorAll('.lang-switch a');
    for (var i = 0; i < links.length; i++) {
      var current = links[i].getAttribute('href') === '#' + lang;
      if (current) links[i].setAttribute('aria-current', 'true');
      else links[i].removeAttribute('aria-current');
    }
  }

  // Un link con #it / #en sceglie solo la lingua: il segno si toglie dall'indirizzo,
  // altrimenti la pagina scorrerebbe oltre l'intestazione.
  function langFromHash() {
    var hash = location.hash.slice(1);
    if (!valid(hash)) return null;
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    return hash;
  }

  apply(langFromHash() || (valid(saved()) ? saved() : fromBrowser()));

  // Cambio del solo #it / #en sulla stessa pagina (senza ricaricarla).
  window.addEventListener('hashchange', function () {
    var lang = langFromHash();
    if (lang) {
      apply(lang);
      setTimeout(function () { window.scrollTo(0, 0); }, 0);
    }
  });

  function decode(value) {
    try { return atob(value); } catch (e) { return null; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-lang'));

    var links = document.querySelectorAll('.lang-switch a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (event) {
        var chosen = this.getAttribute('href').slice(1);
        if (!valid(chosen)) return;
        event.preventDefault();
        save(chosen);
        apply(chosen);
      });
    }

    var mails = document.querySelectorAll('a.email[data-mail]');
    for (var j = 0; j < mails.length; j++) {
      var address = decode(mails[j].getAttribute('data-mail'));
      if (!address) continue;
      var subject = mails[j].getAttribute('data-subject');
      mails[j].href = 'mailto:' + address + (subject ? '?subject=' + encodeURIComponent(subject) : '');
      mails[j].textContent = address;
    }
  });
})();
