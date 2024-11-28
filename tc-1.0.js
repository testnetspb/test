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
        productClone.querySelector(`${cartProductClass}__quantity .t-inputquantity__btn-plus`).addEventListener(" click", () => {
            let quantityInput = productClone.querySelector(`${cartProductClass}__quantity [name="quantity"]`);
            quantityInput.value = parseInt(quantityInput.value) + 1;
            updateCart();
        });

        productClone.querySelector(`${cartProductClass}__quantity .t-inputquantity__btn-minus`).addEventListener("click", () => {
            let quantityInput = productClone.querySelector(`${cartProductClass}__quantity [name="quantity"]`);
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
                updateCart();
            }
        });

        return productClone;
    };

    const setupStyles = () => {
        // Здесь можно добавить стили для корзины
    };

    const updateCart = () => {
        // Логика обновления корзины
        const currentCartData = cartData[0]();
        const cartContainer = document.querySelector(cartHeaderClass);
        cartContainer.innerHTML = ""; // Очистить контейнер перед обновлением

        currentCartData.forEach(product => {
            const productElement = renderProduct(product, "$", ""); // Пример валюты
            cartContainer.appendChild(productElement);
        });
    };

    const updateEmptyCart = () => {
        // Логика для обновления состояния пустой корзины
    };

    const updateSuccessCart = () => {
        // Логика для обновления состояния успешного заказа
    };

    const updateOrderForm = () => {
        // Логика для обновления формы заказа
    };

    const showPopup = () => {
        // Логика для отображения всплывающего окна
    };

    window.tkCart = { init: initialize };
}(window);
