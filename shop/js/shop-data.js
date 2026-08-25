(function () {
    "use strict";

    function withCategory(items, category) {
        return (items || []).map(function (item) {
            return Object.assign({}, item, { category: category });
        });
    }

    window.SHOP_DATA = {
        items: [].concat(
            withCategory(window.SHOP_SHIRTS, "shirts"),
            withCategory(window.SHOP_PRINTS, "prints"),
            withCategory(window.SHOP_MORE, "more")
        )
    };

    window.SHOP_DATA.getItem = function (id) {
        return window.SHOP_DATA.items.find(function (item) {
            return item.id === id;
        }) || null;
    };
})();
