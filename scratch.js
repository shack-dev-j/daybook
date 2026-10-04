(function (root) {
  'use strict';
  const D = root.Daybook;

  let currentItem = null;
  let drawerEl = null;
  let scrimEl = null;

  D.drawer = {
    open: function(itemId) {
      if (itemId) {
        currentItem = D.app.state.items.find(i => i.id === itemId);
      } else {
        currentItem = D.model.blank('homework');
        D.app.state.items.push(currentItem);
        D.store.saveItems(D.app.state.items);
      }
      renderDrawer();
    },
    close: function() {
      if (drawerEl) {
        drawerEl.remove();
        drawerEl = null;
      }
      if (scrimEl) {
        scrimEl.remove();
        scrimEl = null;
      }
      currentItem = null;
      D.app.render(); // Refresh in case anything changed
    }
  };
})(window);
