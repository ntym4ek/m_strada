/**
 * Implements hook_menu().
 */
// храним список доставок со стоимостью
var _shipping_rates = null;

function shipping_menu() {
    try {
        var items = {};
        items['shipping/%'] = {
            title: 'Доставка',
            page_callback: 'shipping_page',
            page_arguments: [1],
            pageshow: 'shipping_page_content',
            options: { reloadPage: true }
        };
        return items;
    }
    catch (error) {
        console.log('shipping_menu - ' + error);
    }
}

/**
 *
 */
function shipping_page() {
    return '<div id="shipping_list"></div>';
}
function shipping_page_content(order_id) {
    // запрашиваем список методов доставки со стоимостью, передаём в форму и вставляем в контент-регион
    //var methods = shipping_get_list(address_id);

    var args = {
        order_id: order_id
    };

    shipping_get_list({
        data: JSON.stringify(args),
        success: function(result) {
            _shipping_rates = result;
            var options = [];
            $.each(result, function(index, object) {
                var amount = '';
                if (object.amount == 0){
                    if (object.error == 0) amount = 'Бесплатно';
                } else {
                    amount = object.amount/100 + ' руб.'
                }
                var amount = amount ? '<span>' + amount + '</span>': '';

                var info = '';
                if (object.id == 'pickup_shipping_service')     info = '<div class="s-info">Со склада в г.Кирово-Чепецк.</div>';
                if (object.id == 'russianpost_shipping_service') info = '<div class="s-info">Расчёт стоимости выполняется по индексу.</div>';
                if (object.id == 'transport_shipping_service')  info = '<div class="s-info">Расчёт стоимости выполняется по индексу.</div>';

                var style = object.error ? 's-error' : 's-message';
                var message = object.message ? '<div class="' + style + '">' + object.message + '</div>' : '';
                options[object.id] = '<div class="s-name">' + object.name + amount + '</div>' + info + message;
            });
            var data = {
                'order_id' : order_id,
                'shipping_list' : options
            };
            // получаем форму, передав в неё список адресов
            var html = drupalgap_get_form('shipping_form', data);
            $('#shipping_list').html(html).trigger('create');
        }
    });
}


function shipping_form(form, form_state, data) {
    // сохраняем информацию о заказе
    form.elements.order_id = {
        type: 'hidden',
        default_value: data.order_id
    };

    // берем первый адрес, если ещё не установлен
    var sid = '';
    for (var key in data.shipping_list) {
        if (!sid && data.shipping_list[key] != undefined) sid = key;
    }

    form.elements.shipping_list = {
        title: 'Выберите способ доставки',
        type: 'radios',
        options: data.shipping_list,
        value: sid,
        attributes: {
            onclick: "shipping_list_click(this)"
        }
    };


    // Buttons
    form.elements['ship_submit'] = {
        type: 'submit',
        value: 'Перейти к выбору оплаты',
        options: {
            attributes: {
                class: 'ui-btn ui-btn-raised clr-primary waves-effect waves-button'
            }
        }
    };
    if (_shipping_rates[sid].error) form.elements['ship_submit'].attributes = { disabled: 'disabled' };

    form.buttons['ship_back'] = {
        title: 'К выбору адреса',
        attributes: {
            onclick: "_drupalgap_back()",
            class: 'ui-btn waves-effect waves-button'
        }
    };
    return form;
}

function shipping_form_submit(form, form_state) {
    // при нажатии на кнопку Перехода к оплате сохранить способ доставки
    var service_name = form_state.values['shipping_list'];
    var order_id = form_state.values['order_id'];

    var args = {
        service_name: service_name,
        order_id: order_id
    };

    shipping_add_shipping_line_item({
        data: JSON.stringify(args),
        success: function() {
            // обновить информацию о заказе
            drupalgap_goto('payment/' + order_id);
        }
    });
}


// запрос на сайт через Services списка методов доставки
function shipping_get_list(options) {
    try {
        options.method = 'POST';
        options.path = 'services_mobile_app_resources/get_shipping_list.json';
        options.service = 'services_mobile_app';
        options.resource = 'get_shipping_list';
        Drupal.services.call(options);
    }
    catch (error) {
        console.log('stradashop_get_shipping_list - ' + error);
    }
}
// запрос на сайт через Services для добавления shipping line_item в заказ
function shipping_add_shipping_line_item(options) {
    try {
        options.method = 'POST';
        options.path = 'services_mobile_app_resources/add_shipping_line_item.json';
        options.service = 'services_mobile_app';
        options.resource = 'add_shipping_line_item';
        Drupal.services.call(options);
    }
    catch (error) {
        console.log('stradashop_get_shipping_list - ' + error);
    }
}


function shipping_list_click(element) {
    var rate = _shipping_rates[element.value];
    // если выбран метод с ошибкой, убрать кнопку перехода к оплате
    if (rate.error) {
        $('#edit-shipping-form-ship-submit').attr('disabled', 'disabled')
    } else {
        $('#edit-shipping-form-ship-submit').removeAttr('disabled');
    };
}