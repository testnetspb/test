!function(window) {
    let isCustomSubmit = false,
        cartMode = "popup",
        cartPageUrl = "/cart",
        labelMode = "normal",
        cartHeaderClass = ".uc-custom-header",
        cartProductClass = ".uc-custom-product",
        cartEmptyClass = ".uc-empty-cart",
        cartSuccessClass = ".uc-custom-success",
        cartOrderClass = ".uc-custom-orderform";

    const onReady = (callback) => {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    };

    const initialize = (options = {}) => {  
        isCustomSubmit = options.useCustomSubmit || isCustomSubmit;
        cartMode = options.cartMode || cartMode;
        cartPageUrl = options.cartPageUrl || cartPageUrl;
        labelMode = options.labelMode || labelMode;
        cartHeaderClass = options.cartHeaderClass || cartHeaderClass;
        cartProductClass = options.cartProductClass || cartProductClass;
        cartEmptyClass = options.cartEmptyClass || cartEmptyClass;
        cartSuccessClass = options.cartSuccessClass || cartSuccessClass;
        cartOrderClass = options.cartOrderClass || cartOrderClass;

        setupStyles();
        onReady(() => {
            onFuncLoad("tcart__reDrawProducts", () => {
                let interval = setInterval(() => {
                    if (window.tcart) {
                        clearInterval(interval);
                        updateCart();
                        if (cartMode === "static" && window.location.pathname === cartPageUrl || cartMode === "popup") {
                            tcart__reDrawProducts();
                            updateEmptyCart();
                            updateSuccessCart();
                            updateOrderForm();
                            updateCart();
                            if (cartMode === "popup") {
                                showPopup();
                            }
                        }
                    }
                }, 100);
            });
        });
    };

    const insertAfter = (referenceNode, newNode) => {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    };

    const createProxy = (obj, callback) => {
        return typeof obj === "object" && obj !== null
            ? new Proxy(obj, {
                set(target, prop, value) {
                    target[prop] = value;
                    callback(target);
                    return true;
                },
                get(target, prop) {
                    return typeof target[prop] === "object" && target[prop] !== null
                        ? createProxy(target[prop], callback)
                        : target[prop];
                }
            })
            : obj;
    };

    const cartData = (() => {
        let currentData = [],
            listeners = [];

        const notify = (newData) => {
            currentData = newData;
            listeners.forEach(callback => callback(currentData));
        };

        const subscribe = (callback) => {
            listeners.push(callback);
        };

        return [() => currentData, notify, subscribe];
    })();

    const renderProduct = (product, currencyLeft, currencyRight) => {
        let productClone = document.querySelector(cartProductClass).cloneNode(true);
        productClone.querySelector(`${cartProductClass}__img .tn-atom`).setAttribute("style", `background-image:url('${product.img}');`);
        productClone.querySelector(`${cartProductClass}__name .tn-atom`).innerText = product.name;
        productClone.querySelector(`${cartProductClass}__sku .tn-atom`).innerText = product.sku;
        productClone.querySelector(`${cartProductClass}__quantity [name="quantity"]`).value = product.quantity;
        productClone.querySelector(`${cartProductClass}__amount .tn-atom`).innerText = `${currencyLeft} ${product.amount} ${currencyRight}`;

        // Вывод опций товара
        let optionsContainer = productClone.querySelector(`${cartProductClass} .uc__product-title__option`);
        if (optionsContainer) {
            optionsContainer.innerHTML = ""; // Очистить предыдущие опции
            if (product.options && product.options.length > 0) {
                product.options.forEach(option => {
                    let optionElement = document.createElement("div");
                    optionElement.className = "product-option"; // Добавляем класс для опций
                    optionElement.innerText = option; // Предполагаем, что опция — это строка
                    optionsContainer.appendChild(optionElement);
                });
            } else {
                optionsContainer.innerText = "Нет доступных опций"; // Если опций нет
            }
        }

        // Добавление обработчиков событий
        productClone.querySelector(`${cartProductClass}__quantity .t-inputquantity__btn-plus`).addEventListener("click", () => { increaseQuantity(product.index); });
        productClone.querySelector(`${cartProductClass}__quantity .t-inputquantity__btn-minus`).addEventListener("click", () => { decreaseQuantity(product); });
 productClone.querySelector(`${cartProductClass}__quantity [name="quantity"]`).addEventListener("focusout", (event) => { updateQuantity(event, product); });
        productClone.querySelector(`${cartProductClass}__remove`).addEventListener("click", () => { removeProduct(product.index); });
        productClone.querySelector(`${cartProductClass}__quantity [name="quantity"]`).onkeydown = function(event) { if (event.key === "Enter") event.preventDefault(); };

        return productClone;
    };

    const updateEmptyCart = (cart) => {
        let emptyCartBlock = document.querySelector(cartEmptyClass);
        if (!emptyCartBlock) {
            console.error(`Не найден блок, появляющийся при пустой корзине. Проверьте наличие этого блока и его класса ${cartEmptyClass}`);
            return;
        }

        let clonedProducts = document.querySelectorAll(`${cartProductClass}--clone`);
        clonedProducts.forEach(product => product.remove());

        if (cart.products.length === 0) {
            emptyCartBlock.classList.add("showed");
            return;
        }

        emptyCartBlock.classList.remove("showed");
        cart.products.forEach(product => {
            let productElement = renderProduct(product, cart.currency_txt_l, cart.currency_txt_r);
            productElement.classList.add(`${cartProductClass.slice(1)}--clone`);
            let lastProductElement = Array.from(document.querySelectorAll(cartProductClass)).pop();
            insertAfter(lastProductElement, productElement);
        });
    };

    const updateSuccessCart = (cart) => {
        let orderForm = document.querySelector(cartOrderClass);
        let amountElement = orderForm.querySelector(`${cartOrderClass}__amount .tn-atom`);
        amountElement.innerText = `${cart.currency_txt_l} ${cart.amount} ${cart.currency_txt_r}`;
    };

    const updateCart = () => {
        let cartDetails = {
            amount: window.tcart.amount,
            currency: window.tcart.currency,
            currency_txt_l: window.tcart.currency_txt_l,
            currency_txt_r: window.tcart.currency_txt_r,
            delivery: window.tcart.delivery,
            promocode: window.tcart.promocode,
            products: window.tcart.products.map((product, index) => ({
                index: index,
                img: product.img,
                name: product.name,
                amount: product.amount,
                sku: product.sku,
                quantity: product.quantity,
                uid: product.uid,
                options: product.options // Добавляем опции товара
            }))
        };
        cartData[1](cartDetails);
    };

    const showPopup = () => {
        let cartIconWrapper = document.querySelector(".t706__carticon-wrapper");
        if (cartIconWrapper) {
            cartIconWrapper.addEventListener("click", event => {
                if (cartMode === "static") {
                    event.preventDefault();
                    event.stopPropagation();
                    window.location.href = cartPageUrl;
                }
            });
        }
    };

    const setupStyles = () => {
        let head = document.querySelector("head");
        let styleElement = document.createElement("style");
        styleElement.innerHTML = `
            ${cartProductClass}, ${cartEmptyClass}, ${cartSuccessClass} { display: none; }
            ${cartProductClass}--clone { display: block; }
            .showed { display: block; }
            .custom-cart-popup { padding: 4rem 0; }
            ${cartOrderClass}__submit, ${cartProductClass}__remove { cursor: pointer; }
        `;
        head.appendChild(styleElement);
    };

    window.tkCart = { init: initialize };
}(window);
