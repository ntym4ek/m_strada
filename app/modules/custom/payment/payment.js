/**
 * Implements hook_menu().
 */

function payment_menu() {
    try {
        var items = {};
        items['payment/%'] = {
            title: 'Оплата заказа',
            page_callback: 'payment_page',
            page_arguments: [1],
            pageshow: 'payment_page_content'
        };
        return items;
    }
    catch (error) {
        console.log('payment_menu - ' + error);
    }
}

/**
 *
 */
function payment_page() {
    return '<div id="payment_list"></div>';
}
function payment_page_content(order_id) {
    // составляем список методов оплаты, передаём в форму и вставляем в контент-регион
    var options = {
        1: 'Пластиковая карта',
        2: 'Безналичный расчёт'
    };

    var data = {
        order_id : order_id,
        payment_list : options
    };

    // получаем форму, передав в неё список адресов
    var html = '<div id="plastic_pay_container"></div>'
        + drupalgap_get_form('payment_form', data);
    $('#payment_list').html(html).trigger('create');
}


function payment_form(form, form_state, data) {

    form.elements.order_id = {
        type: 'hidden',
        default_value: data.order_id
    };

    // берем метод адрес, если ещё не установлен
    var sid = '';
    for (var key in data.payment_list) {
        if (!sid && data.payment_list[key] != undefined) sid = key;
    }

    form.elements.payment_list = {
        title: 'Выберите способ оплаты',
        type: 'radios',
        options: data.payment_list,
        value: sid,
        attributes: {
            onclick: "payment_list_click(this)"
        }
    };

    // Buttons
    form.elements['pay_submit'] = {
        type: 'submit',
        value: 'Оплатить',
        options: {
            attributes: {
                class: 'ui-btn ui-btn-raised clr-primary waves-effect waves-button'
            }
        }
    };

    form.buttons['pay_back'] = {
        title: 'К выбору доставки',
        attributes: {
            onclick: "_drupalgap_back()",
            class: 'ui-btn waves-effect waves-button'
        }
    };
    return form;
}

function payment_form_submit(form, form_state) {
    // при нажатии на кнопку Перехода к оплате сохранить способ доставки
    var service_id = form_state.values['payment_list'];
    var order_id = form_state.values['order_id'];




    // если выбрана пластиковая карта
    if (service_id == 1) {
        // запросить обновлённую корзину
        commerce_cart_index(null, {
            success: function(result) {
                if (result.length != 0) {
                    $.each(result, function(order_id, order) {
                        // Set aside the order so it can be used later without fetching it again.
                        _commerce_order[order_id] = order;

                        var amount = order.commerce_order_total.amount/100;
                        var args = {
                            order_id: order_id
                        };

                        // создаём временную YM транзакцию из которой модуль yamoney возьмёт данные для commerce_payment транзакции
                        create_ym_transaction({
                            data: JSON.stringify(args),
                            success: function(result) {
                                //var html = ' <form id="plastic_pay" action="https://demomoney.yandex.ru/eshop.xml" method="post">'
                                var html = ' <form id="plastic_pay" action="https://money.yandex.ru/eshop.xml" method="post">'
                                    + '         <input name="shopId" value="35098" type="hidden"/>'
                                    //+ '         <input name="scid" value="60604" type="hidden"/>'
                                    + '         <input name="scid" value="24558" type="hidden"/>'
                                    + '         <input name="sum" value="' + amount + '" type="hidden">'
                                    + '         <input name="customerNumber" value="' + Drupal.user.uid + '" type="hidden"/>'
                                    + '         <input name="paymentType" value="AC" type="hidden"/>'
                                    + '         <input name="orderNumber" value="' + order_id + '" type="hidden"/>'
                                    + '         <input name="transaction_id" value="' + result.transaction_id + '" type="hidden"/>'
                                    + '         <input name="shopSuccessURL" value="http://kccc.ru/yamoney/complete" type="hidden"/>'
                                    + '         <input name="shopFailURL" value="http://kccc.ru/yamoney/fail" type="hidden"/>'
                                    + '         <input name="client" value="application" type="hidden"/>'
                                    + '         <input type="submit" value="Заплатить"/>'
                                    + ' </form>';

                                $('#plastic_pay_container').html(html).trigger('create');
                                document.getElementById('plastic_pay').submit();
                            }
                        });

                        return false; // Process only one cart.
                    });
                }
            }
        });
    }

    // если выбран безнал, создать commerce_payment транзакцию и перенаправить на страницу с реквизитами
    if (service_id == 2) {
        var args = {
            service_name: 'bank_transfer|commerce_payment_bank_transfer',
            order_id: order_id,
            status: 'pending'
        };

        set_payment_status({
            data: JSON.stringify(args),
            success: function(result) {
                drupalgap_goto('checkout/complete/' + order_id)
            }
        });
    }

}


// запрос на сайт через Services для создания временной YM nhfypfrwbb
function create_ym_transaction(options) {
    try {
        options.method = 'POST';
        options.path = 'services_mobile_app_resources/create_ym_transaction.json';
        options.service = 'services_mobile_app';
        options.resource = 'create_ym_transaction';
        Drupal.services.call(options);
    }
    catch (error) {
        console.log('stradashop_create_ym_transaction - ' + error);
    }
}

// запрос на сайт через Services для добавления payment line_item в заказ
function set_payment_status(options) {
    try {
        options.method = 'POST';
        options.path = 'services_mobile_app_resources/set_payment_status.json';
        options.service = 'services_mobile_app';
        options.resource = 'set_payment_status';
        Drupal.services.call(options);
    }
    catch (error) {
        console.log('stradashop_set_payment_status - ' + error);
    }
}

function payment_list_click(element) {
    // изменить надпись на кнопке
    if (element.value == 0) {
        $('#edit-shipping-form-ship-submit').attr('value', 'Оплатить')
    } else {
        $('#edit-shipping-form-ship-submit').attr('value', 'Оформить заказ')
    }
}
