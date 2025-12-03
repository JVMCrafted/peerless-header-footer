/**
 * External Navigation JavaScript
 * Fetches WordPress menus via REST API and renders them
 */

(function () {
  "use strict";

  // ========================================
  // CONFIGURATION
  // ========================================
  //
  // FOR EXTERNAL HOSTING: Set this to your WordPress site URL
  // Example: 'https://peerlesspump.com' or 'http://peerless-pump.local'
  //
  // FOR WORDPRESS HOSTING: Use window.location.origin
  //
  // const WP_SITE_URL = "http://peerless-pump.local"; // Uncomment for local hosting
  // const WP_SITE_URL = "https://peerlesspumdev.wpenginepowered.com"; // Uncomment for development hosting
  const WP_SITE_URL = "https://www.peerlesspump.com"; // Uncomment for production hosting

  const WP_API_BASE = `${WP_SITE_URL}/wp-json/wp/v2`;
  const WP_CUSTOM_API = `${WP_SITE_URL}/wp-json/custom/v1`;
  const WP_MENUS_API = `${WP_SITE_URL}/wp-json/wp-api-menus/v2`;

  /**
   * Fetch menu data by ID directly
   */
  async function fetchMenuById(menuId) {
    try {
      // Try our custom endpoint first
      let url = `${WP_CUSTOM_API}/menu/${menuId}`;
      let response = await fetch(url);

      if (response.ok) {
        const menuData = await response.json();
        return menuData.items || [];
      }

      // Fallback: Try wp-api-menus plugin endpoint (if installed)
      url = `${WP_MENUS_API}/menus/${menuId}`;
      response = await fetch(url);

      if (response.ok) {
        const menuData = await response.json();
        return menuData.items || [];
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch menu data from WordPress REST API
   */
  async function fetchMenu(menuSlug, menuId = null) {
    try {
      // If menu ID is provided, use it directly
      if (menuId) {
        return await fetchMenuById(menuId);
      }

      // First, try our custom endpoint using menu location slug
      const locationSlug = menuSlug.toLowerCase().replace(/\s+/g, "-");
      let response = await fetch(`${WP_CUSTOM_API}/menus/${locationSlug}`);

      if (response.ok) {
        const menuItems = await response.json();
        return menuItems;
      }

      // Try alternate location names
      const alternateLocations = {
        "main-menu": "main",
        "footer-menu": "footer",
      };

      if (alternateLocations[locationSlug]) {
        response = await fetch(`${WP_CUSTOM_API}/menus/${alternateLocations[locationSlug]}`);
        if (response.ok) {
          const menuItems = await response.json();
          return menuItems;
        }
      }

      // Try using wp-api-menus plugin (if installed)
      const menusResponse = await fetch(`${WP_MENUS_API}/menus`);

      if (menusResponse.ok) {
        const menus = await menusResponse.json();
        const menu = menus.find((m) => m.slug === locationSlug || m.name === menuSlug);

        if (menu) {
          return await fetchMenuById(menu.ID);
        }
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clean WordPress shortcodes and formatting from text
   */
  function cleanMenuTitle(title) {
    if (!title) return "";

    // Replace [rball] with registered trademark symbol
    let cleaned = title.replace(/\[rball\]/g, "<sup>&reg;</sup>");

    // Remove other WordPress shortcodes like [tt-n], [/tt-n], etc.
    cleaned = cleaned.replace(/\[\/?\w+(-\w+)*\]/g, "");

    // Remove any extra whitespace
    cleaned = cleaned.trim().replace(/\s+/g, " ");

    return cleaned;
  }

  /**
   * Build nested menu structure from flat array
   */
  function buildMenuTree(items, parentId = 0) {
    const branch = [];

    items.forEach((item) => {
      if (item.menu_item_parent == parentId) {
        // Clean the title from WordPress shortcodes
        item.title = cleanMenuTitle(item.title);

        const children = buildMenuTree(items, item.ID);
        if (children.length > 0) {
          item.children = children;
        }
        branch.push(item);
      }
    });

    return branch;
  }

  /**
   * Render menu items as HTML
   */
  function renderMenuItems(items, isFooter = false) {
    if (!items || items.length === 0) {
      return "";
    }

    let html = "";

    items.forEach((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const classes = [];

      // Add WordPress menu item classes
      if (item.classes) {
        classes.push(...item.classes);
      }

      if (hasChildren) {
        classes.push("menu-item-has-children");
      }

      // Build the list item
      html += `<li class="${classes.join(" ")}">`;

      // Add submenu toggle for mobile if has children (header only)
      if (hasChildren && !isFooter) {
        html += `<span class="submenu-toggle" aria-label="Toggle submenu"></span>`;
      }

      // Add the link
      html += `<a href="${item.url}">${item.title}</a>`;

      // Add children if they exist
      if (hasChildren) {
        html += '<ul class="sub-menu">';
        html += renderMenuItems(item.children, isFooter);
        html += "</ul>";
      }

      html += "</li>";
    });

    return html;
  }

  /**
   * Initialize main navigation
   */
  async function initMainNavigation() {
    const mainMenuContainer = document.getElementById("main-menu");
    if (!mainMenuContainer) return;

    try {
      // Use menu ID 3 directly (Main Menu)
      const menuItems = await fetchMenu("Main Menu", 3);

      if (menuItems.length > 0) {
        const menuTree = buildMenuTree(menuItems);
        mainMenuContainer.innerHTML = renderMenuItems(menuTree, false);

        // Initialize mobile menu toggles
        initMobileMenuToggles();
      } else {
        // Fallback menu if API fails
        mainMenuContainer.innerHTML = `
                    <li><a href="/">Home</a></li>
                    <li><a href="/about/">About</a></li>
                    <li><a href="/products/">Products</a></li>
                    <li><a href="/contact/">Contact</a></li>
                `;
      }
    } catch (error) {
      // Silently fail and use fallback menu
      mainMenuContainer.innerHTML = `
                <li><a href="/">Home</a></li>
                <li><a href="/about/">About</a></li>
                <li><a href="/products/">Products</a></li>
                <li><a href="/contact/">Contact</a></li>
            `;
    }
  }

  /**
   * Initialize footer navigation
   */
  async function initFooterNavigation() {
    const footerMenuContainer = document.getElementById("footer-menu");
    if (!footerMenuContainer) return;

    try {
      const menuItems = await fetchMenu("Footer Menu");

      if (menuItems.length > 0) {
        const menuTree = buildMenuTree(menuItems);
        footerMenuContainer.innerHTML = renderMenuItems(menuTree, true);
      }
    } catch (error) {
      // Silently fail - footer can be empty
    }
  }

  /**
   * Initialize mobile menu toggles
   */
  function initMobileMenuToggles() {
    const navToggle = document.querySelector(".site-header__nav-toggle");
    const menuOverlay = document.querySelector(".menu-overlay");
    const body = document.body;

    // Hamburger menu toggle
    if (navToggle) {
      navToggle.addEventListener("click", function () {
        body.classList.toggle("nav-open");
      });
    }

    // Close menu when clicking overlay
    if (menuOverlay) {
      menuOverlay.addEventListener("click", function () {
        body.classList.remove("nav-open");
      });
    }

    // Submenu toggles (mobile only)
    const submenuToggles = document.querySelectorAll(".submenu-toggle");
    submenuToggles.forEach((toggle) => {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        const parentLi = this.closest("li");
        const submenu = parentLi.querySelector(".sub-menu");

        if (submenu) {
          const isActive = parentLi.classList.contains("submenu-active");

          parentLi.classList.toggle("submenu-active");

          if (isActive) {
            // Slide up
            const currentHeight = submenu.scrollHeight;
            submenu.style.height = currentHeight + "px";
            submenu.style.overflow = "hidden";

            // Force reflow
            requestAnimationFrame(() => {
              submenu.style.transition = "height 300ms ease, padding 300ms ease";
              submenu.style.height = "0px";
              submenu.style.paddingTop = "0px";
              submenu.style.paddingBottom = "0px";
            });

            // Wait for transition to complete
            const handleTransitionEnd = (e) => {
              if (e.propertyName === "height") {
                submenu.style.display = "none";
                submenu.style.height = "";
                submenu.style.paddingTop = "";
                submenu.style.paddingBottom = "";
                submenu.style.overflow = "";
                submenu.style.transition = "";
                submenu.removeEventListener("transitionend", handleTransitionEnd);
              }
            };
            submenu.addEventListener("transitionend", handleTransitionEnd);
          } else {
            // Slide down
            submenu.style.display = "block";
            submenu.style.height = "0px";
            submenu.style.paddingTop = "0px";
            submenu.style.paddingBottom = "0px";
            submenu.style.overflow = "hidden";

            const height = submenu.scrollHeight;

            // Force reflow
            requestAnimationFrame(() => {
              submenu.style.transition = "height 300ms ease, padding 300ms ease";
              submenu.style.height = height + "px";
              submenu.style.paddingTop = "";
              submenu.style.paddingBottom = "";
            });

            // Wait for transition to complete
            const handleTransitionEnd = (e) => {
              if (e.propertyName === "height") {
                submenu.style.height = "";
                submenu.style.overflow = "";
                submenu.style.transition = "";
                submenu.removeEventListener("transitionend", handleTransitionEnd);
              }
            };
            submenu.addEventListener("transitionend", handleTransitionEnd);
          }
        }
      });
    });
  }

  /**
   * Handle scroll behavior for header
   */
  function handleScroll() {
    const scrollPosition = window.scrollY;
    const body = document.body;

    if (scrollPosition > 50) {
      body.classList.add("is-scrolled");
    } else {
      body.classList.remove("is-scrolled");
    }
  }

  /**
   * Set current year in footer
   */
  function setCurrentYear() {
    const yearElement = document.getElementById("current-year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  /**
   * Initialize everything when DOM is ready
   */
  function init() {
    // Set current year
    setCurrentYear();

    // Initialize navigation
    initMainNavigation();
    initFooterNavigation();

    // Handle scroll events
    window.addEventListener("scroll", handleScroll);

    // Initial scroll check
    handleScroll();
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
