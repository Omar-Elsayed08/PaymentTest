/*
 *   id
 *   title
 *   description
 *   price
 *   images      array of images, the first is the thumbnail.
 *   sizes
 *   swatch      "blue" | "orange" | "black"
 */

(function () {
    "use strict";

    var catalog = window.SHOP_SHIRT_CATALOG;
    var shirt = catalog.shirt;
    var design = catalog.design;

    var doodler = design("doodler", "doodler");
    var poser = design("poser", "poser");
    var brody = design("adrien brody", "adrienbrody");
    var stork = design("storks", "stork");
    var ppe = design("ppe", "ppe");
    var house = design("house1", "house1_");
    var squiggles = design("squiggles", "squiggles");
    var lion = design("c lion", "clion");
    var croc = design("c croc", "ccroc");
    var elephant = design("c elephant", "celephant");
    var monkey = design("c monkey", "cmonkey");
    var bunny = design("c bunny", "cbunny");
    var ensemble = design("c grid", "cgrid");
    var outlines = design("c grid outline", "cgridoutline");
    var hamburger = design("hamburger", "hamburger");

    window.SHOP_SHIRTS = [
        shirt({
            id: "shirt1",
            title: "doodler",
            description: "i imagine they're listening to someone like enya",
            price: 36,
            swatch: "blue",
            colors: doodler.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                black: { sw: ["000025", "000026"], ec: ["000011", "00012"] },
                pink: { sw: [19, 20], ec: [3, 4] },
                red: { sw: [21, 22], ec: [9, 10] },
                blue: { sw: [23, 24], ec: [5, 6] },
                brown: { sw: [7, 8], ec: [7, 8] },
                green: { sw: [17, 18] },
                "dark-green": { sw: [15, 16] },
                "washed-green": { sw: [3, 4] },
                purple: { sw: [5, 6] },
                "dark-purple": { sw: [13, 14] },
                "dark-blue": { sw: [11, 12] },
                grey: { sw: [9, 10] }
            })
        }),
        shirt({
            id: "shirt2",
            title: "poser",
            description: "text blurb text blurb more text its a blurb text blurb text blurb more text its a blurb text blurb text blurb more text its a blurb",
            price: 36,
            swatch: "orange",
            colors: poser.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                pink: { sw: [3, 4], ec: [3, 4] },
                blue: { sw: [13, 14], ec: [5, 6] },
                red: { sw: [7, 8], ec: [7, 8] },
                brown: { sw: [9, 10], ec: [9, 10] },
                purple: { sw: [11, 12] },
                "dark-purple": { sw: [15, 16] },
                "dark-blue": { sw: [17, 18] },
                grey: { sw: [19, 20] },
                "dark-grey": { sw: [21, 22] }
            })
        }),
        shirt({
            id: "shirt3",
            title: "adrien brody",
            description: "They're already counting me down. Okay. Thank you, God. Thank you for this, this blessed life. If I may just humbly begin by giving thanks for the tremendous outpouring of love that I have felt from this world and every individual that has treated me with respect and appreciation. I am, I feel so fortunate. You know, acting is a very fragile profession. It looks very glamorous, and in certain moments it is, but the one thing that I've gained, having the privilege to come back here, is to have some perspective. And no matter where you are in your career, no matter what you've accomplished, it can all go away. And I think what makes this night most special is the awareness of that and the gratitude that I have to still do the work that I love. Winning an award like this is, it signifies a destination, and it's something my character references in the film. But to me it also, beyond the pinnacle of a career, it is a chance to begin again and the opportunity to hopefully be fortunate enough so that the next twenty years of my life, that I can prove that I am worthy of such meaningful and important and relevant roles. I share this with my fellow nominees who are just wonderful human beings who exude grace and goodness and brilliance with their work.",
            price: 36,
            swatch: "black",
            colors: brody.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                pink: { sw: [3, 4], ec: [3, 4] },
                grey: { sw: [5, 6] },
                blue: { ec: [5, 6] },
                orange: { sw: [7, 8] },
                green: { sw: [9, 10] },
                black: { sw: [11, 10], ec: [7, 8] }
            })
        }),
        shirt({
            id: "shirt4",
            title: "stork",
            description: "Rockabye baby, in the treetop. / Don't you know a treetop / Is no safe place to rock? / And who put you up there, / And your cradle too? / Baby, I think someone down here's Got it in for you. - Shel Silverstein",
            price: 42,
            swatch: "black",
            colors: stork.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                pink: { sw: [7, 8], ec: [3, 4] },
                green: { sw: [5, 6] },
                purple: { sw: [3, 4] },
                red: { sw: [9, 10] },
                blue: { sw: [11, 12], ec: [5, 6] },
                brown: { sw: [17, 18] },
                "dark-brown": { sw: [21, 22], ec: [7, 8] },
                "washed-green": { sw: [15, 16] },
                "dark-grey": { sw: [19, 20] }
            })
        }),
        shirt({
            id: "shirt5",
            title: "purple people eater",
            description: "he eats purple people",
            price: 42,
            swatch: "blue",
            colors: ppe.colors({
                snow: { sw: [3, 4], ec: [3, 4] },
                black: { sw: [1, 2], ec: [1, 2] },
                grey: { sw: [5, 6] },
                green: { sw: [7, 8] },
                "dark-brown": { sw: [9, 10], ec: [9, "000010"] },
                blue: { sw: [11, 12], ec: [7, 8] },
                purple: { sw: [15, 16] },
                "dark-purple": { sw: [13, 14] },
                pink: { ec: [5, 6] }
            })
        }),
        shirt({
            id: "shirt6",
            title: "house",
            description: "one of my senior superlatives was most likely to live in a bungalow. i look forward to that day",
            price: 42,
            swatch: "orange",
            colors: house.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                red: { sw: [3, 4] },
                green: { sw: [5, 6] },
                purple: { sw: [7, 8] },
                grey: { sw: [9, 10] },
                pink: { sw: [11, 12], ec: [3, 4] },
                blue: { sw: [13, 14], ec: [5, 6] }
            })
        }),
        shirt({
            id: "shirt7",
            title: "squiggles",
            description: "I shot an arrow toward the sky, / It hit a white cloud floating by. / The cloud fell dying to the shore, / I don't shoot arrows anymore. - Shel Silverstein",
            price: 42,
            swatch: "blue",
            imagesByMaterial: squiggles.images({ sw: [1, 2], ec: [1, 2] })
        }),
        shirt({
            id: "shirt8",
            title: "circus lion",
            description: "roar",
            price: 42,
            swatch: "black",
            colors: lion.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                grey: { sw: [3, 4] },
                brown: { sw: [15, 16] },
                blue: { sw: [7, 8], ec: [5, 6] },
                green: { sw: [11, 12] },
                pink: { sw: [13, 14], ec: [3, 4] },
                purple: { sw: [19, 20] },
                "dark-grey": { sw: [17, 18] },
                "dark-blue": { sw: [21, 22] },
                "dark-brown": { sw: [5, 6], ec: [7, 8] },
                "washed-green": { sw: [9, 10] }
            })
        }),
        shirt({
            id: "shirt9",
            title: "circus crocodile",
            description: "apparently, after a period of bad flooding, the bridge over the mississippi river, from memphis into arkansas smelled especially bad. fish had gotten caught in the trees and died there after the water receded.",
            price: 42,
            swatch: "black",
            colors: croc.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                green: { sw: [15, 16] },
                pink: { sw: [19, 20], ec: [3, 4] },
                grey: { sw: [9, 10] },
                "dark-grey": { sw: [17, 18] },
                purple: { sw: [13, 14] },
                "dark-blue": { sw: [11, 12] },
                blue: { ec: [5, 6] },
                "dark-brown": { sw: [7, 8], ec: [7, 8] },
                "washed-green": { sw: [3, 4] },
                "washed-purple": { sw: [5, 6] }
            })
        }),
        shirt({
            id: "shirt10",
            title: "circus elephant",
            description: "this is lottie",
            price: 42,
            swatch: "blue",
            colors: elephant.colors({
                snow: { sw: [2, 3], ec: [1, 2] },
                pink: { sw: [18, 1], ec: [5, 6] },
                grey: { sw: [4, 5] },
                blue: {ec: [7, 8] },
                purple: {sw: [8, 9] },
                "dark-blue": { sw: [6, 7] },
                green: { sw: [16, 17] },
                "dark-brown": { sw: [12, 13], ec: [3, 4] },
                "washed-green": { sw: [14, 15] },
                "dark-grey": { sw: [10, 11] }
            })
        }),
        shirt({
            id: "shirt11",
            title: "circus monkey",
            description: "”rajhfjafjurb” - monkey",
            price: 42,
            swatch: "blue",
            colors: monkey.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                pink: { sw: [3, 4], ec: [3, 4] },
                green: { sw: [5, 6] },
                "washed-green": { sw: [7, 8] },
                "washed-purple": { sw: [9, 10] },
                "dark-blue": { sw: [11, 12] },
                purple: {sw: [13, 14] },
                "dark-grey": { sw: [15, 16] },
                brown: { sw: [17, 18] },
                "dark-brown": { sw: [23, 24], ec: [7, 8] },
                grey: { sw: [19, 20] },
                blue: { sw: [21, 22], ec: [5, 6] },
                
                
            })
         }),
        shirt({
            id: "shirt12",
            title: "circus bunny",
            description: "”Raccaccoonie” - Evelyn Wong",
            price: 42,
            swatch: "black",
            colors: bunny.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                pink: { sw: [9, 10], ec: [3, 4] },
                green: { sw: [15, 16] },
                "washed-green": { sw: [3, 4] },
                "washed-purple": { sw: [5, 6] },
                purple: {sw: [13, 14] },
                "dark-grey": { sw: [19, 20] },
                "dark-brown": { sw: [17, 18], ec: [7, 8] },
                grey: { sw: [11, 12] },
                blue: { sw: [7, 8], ec: [5, 6] },
            }),
        }),
        shirt({
            id: "shirt13",
            title: "circus ensemble",
            description: "rajhfjafjurb",
            price: 42,
            swatch: "orange",
            colors: ensemble.colors({
                snow: { sw: [1, 2], ec: [1, 2] },
                pink: {ec: [3, 4] },
                green: { sw: [7, 8] },
                brown: { sw: [9, 10] },
                "washed-green": { sw: [3, 4] },
                purple: {sw: [13, 14] },
                "dark-brown": { ec: [7, 8] },
                grey: { sw: [5, 6] },
                blue: { sw: [11, 12], ec: [5, 6] },
            }),
        }),
        shirt({
            id: "shirt14",
            title: "circus outlines",
            description: "a scrub is a guy that thinks he's fly ... a scrub is a guy who can't get no love from me - TLC (tender loving care)",
            price: 42,
            swatch: "orange",
            colors: outlines.colors({
                snow: { sw: [1, 2], ec: [1, 8] },
                purple: {sw: [3, 4] },
                green: { sw: [5, 6] },
                pink: { sw: [7, 8], ec: [7, 6] },
                blue: { sw: [9, 10], ec: [5, 6] },
                "dark-brown": {ec: [2, 3] },
                "washed-grey": { sw: [11, 12] },
            }),
        }),
         shirt({
            id: "shirt15",
            title: "the essential burger",
            description: "1 lb. ground beef (80/20 blend), 1 Tbsp. Worcestershire sauce, 1/2 tsp. onion powder, 1/2 tsp. garlic powder, 1/4 tsp. black pepper, 3/4 tsp. kosher salt",
            price: 42,
            swatch: "orange",
            colors: hamburger.colors({
                snow: { sw: [1, 2] , ec: [1, 2] },
                red: {sw: [5, 6] },
                "dark-green": { sw: [3, 4] },
                green: { sw: [7, 8] },
            }),
        })
    ];
})();
