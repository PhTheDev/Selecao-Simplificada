/** Script inline no <head>: aplica a classe antes da hidratação para não piscar. Padrão do sistema: escuro. */
export const themeInitScript = `try{var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){document.documentElement.classList.add('dark')}`;
