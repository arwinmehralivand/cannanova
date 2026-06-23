const navToggle = document.getElementById("nav-toggle");
const siteNav = document.getElementById("site-nav");

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("site-nav--open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.classList.toggle("nav-toggle--open", isOpen);
});

siteNav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    siteNav.classList.remove("site-nav--open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.classList.remove("nav-toggle--open");
  }
});
