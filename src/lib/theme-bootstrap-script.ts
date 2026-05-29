/** Inline before paint to avoid theme flash; must match useThemeStore persist key/shape. */
export const THEME_BOOTSTRAP_SCRIPT = `
(function(){
  try {
    var KEY='ryanbudget-appearance';
    var accent='#0071e3';
    var mode='system';
    var raw=localStorage.getItem(KEY);
    if(raw){
      var j=JSON.parse(raw);
      if(j.state){
        if(j.state.accentHex) accent=j.state.accentHex;
        if(j.state.appearance) mode=j.state.appearance;
      }
    }
    var d=document.documentElement;
    d.style.setProperty('--accent-custom',accent);
    var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    d.dataset.theme=dark?'dark':'light';
  } catch(e) {}
})();
`;
