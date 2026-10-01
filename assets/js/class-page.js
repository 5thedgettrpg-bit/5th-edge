
document.querySelectorAll("details.feature").forEach(d=>d.addEventListener("toggle",()=>{const p=d.querySelector(".plus");if(p)p.textContent=d.open?"−":"+"}));
document.querySelectorAll(".subclass-select").forEach(s=>s.addEventListener("change",()=>{const n=s.closest(".subclass").querySelector(".subclass-note");if(n)n.textContent=s.value==="base"?"Showing base class features.":"Subclass features will layer into this page from the subclass data file."; }));
