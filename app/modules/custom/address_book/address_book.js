/**
 * Created by ntym on 18.08.2015.
 */

// ссылка для возврата после создания или редактирования адреса
var back_link = null;

/**
 * Implements hook_menu().
 */
function address_book_menu() {
    try {
        var items = {};
        // аргументы: вызывающий модуль; id объекта, для которого выбираем адрес; id текущего адреса
        items['address-book/open/%/%/%'] = {
            title: 'Адресная книга',
            page_callback: 'address_book_page',
            page_arguments: [2, 3, 4],
            pageshow: 'address_book_page_content',
            options: { reloadPage: true }
        };
        items['address-book/new'] = {
            title: 'Добавить адрес',
            page_callback: 'address_book_edit',
            pageshow: 'address_book_edit_content',
            page_arguments: [1],
            options: { reloadPage: true }
        };
        items['address-book/edit/%'] = {
            title: 'Редактировать адрес',
            page_callback: 'address_book_edit',
            pageshow: 'address_book_edit_content',
            page_arguments: [1, 2],
            options: { reloadPage: true }
        };
        return items;
    }
    catch (error) {
        console.log('address_book_menu - ' + error);
    }
}

/**
 *
 */
function address_book_page(module, cid, address_id) {
    return '<div id="address_book_list_' + module + '_' + cid + '_' + address_id + '"></div>';
}
function address_book_page_content(module, cid, address_id) {
    back_link = 'address-book/open/' + module + '/' + cid + '/' + address_id;

    // запрашиваем список адресов, передаём в форму и вставляем в контент-регион
    // node_index() не возвращает ноды? если у них status == 0
    var path_to_view = 'address-book.json/' + Drupal.user.uid;
    views_datasource_get_view_result(path_to_view, {
        success: function (result) {
            var options = {};
            if (result.nodes.length > 0) {
                var flag = false;
                $.each(result.nodes, function (index, object) {
                    var city = object.node.city ? '<div class="ab-city">' + object.node.city + '</div>' : '';
                    options[object.node.nid] = '<div class="ab-name">' + object.node.surname + ' ' + object.node.name1 + '</div>' + city;
                    // проверка наличия address_id в полученном списке
                    if (object.node.nid == address_id) flag = true;
                });
            }
            var data = {
                module : module,
                cid : cid,
                address_id : flag ? address_id : 0,
                address_list : options
            };
            // получаем форму, передав в неё список адресов
            var html = drupalgap_get_form('address_book_form', data);
            $('#address_book_list_' + module + '_' + cid + '_' + address_id + '').html(html).trigger('create');
        }
    });
}

function address_book_form(form, form_state, data) {
    // сохраняем информацию о вызывающем модуле
    form.elements.module = {
        type: 'hidden',
        default_value: data.module
    };
    form.elements.cid = {
        type: 'hidden',
        default_value: data.cid
    };
    dpm(data.address_list);
    // берем первый адрес, если ещё не установлен
    var aid = data.address_id;
    if (!$.isEmptyObject(data.address_list)) {
        for (var key in data.address_list) {
            if (!aid && data.address_list[key] != undefined) aid = key;
        }

        form.elements.address = {
            title: 'Сохраненные адреса',
            type: 'radios',
            options: data.address_list,
            value: aid,
            attributes: {
                onclick: "address_list_click_handler(this)"
            }
        };

        form.elements['addr_submit'] = {
            type: 'submit',
            value: 'Выбрать адрес',
            options: {
                attributes: {
                    class: 'ui-btn ui-btn-raised clr-primary waves-effect waves-button'
                }
            }
        };
        form.buttons['create_new_address'] = {
            title: 'Добавить адрес',
            attributes: {
                onclick: "drupalgap_goto('address-book/new')",
                class: 'ui-btn waves-effect waves-button'
            }
        };
    } else {
        form.elements.mrkup = {
            markup: '<span style="color: gray;">Адресная книга пуста</span>'
        };
        form.buttons['create_new_address'] = {
            title: 'Добавить адрес',
            attributes: {
                onclick: "drupalgap_goto('address-book/new')",
                class: 'ui-btn ui-btn-raised clr-primary waves-effect waves-button'
            }
        };
    }


    if (aid) {
        form.buttons['edit_address'] = {
            title: 'Редактировать адрес',
            attributes: {
                onclick: "drupalgap_goto('address-book/edit/" + aid + "');",
                class: 'ui-btn waves-effect waves-button'
            }
        };
    }

    return form;
}

function address_book_form_submit(form, form_state) {

    var module = form_state.values.module;
    var cid = form_state.values.cid;
    var address_id = form_state.values.address;
    var callback = module + '_address_book_submit';

    // вызываем callback функцию вызывающего модуля
    window[callback](cid, address_id);
}

function address_list_click_handler (element) {
    var aid = element.value;
    $('#edit-address-book-form-edit-address').attr('onclick', "drupalgap_goto('address-book/edit/" + aid + "');")
}


function address_book_edit(op, address_id) {
    return '<div id="address_' + address_id + '"></div>';
}
function address_book_edit_content(op, address_id) {
    // в зависимости от операции открываем пустую форму или заполненную
    if (op == 'new') {
        var data = {
            op : op,
            address_id : address_id,
            address : {}
        };
        var html = drupalgap_get_form('address_book_address_form', data);
        $('#address_' + address_id).html(html).trigger('create');
    } else {
        node_retrieve(address_id, {
            success: function(result) {
                var data = {
                    op : op,
                    address_id : address_id,
                    address : result
                };
                var html = drupalgap_get_form('address_book_address_form', data);
                $('#address_' + address_id).html(html).trigger('create');
            }
        });
    }
}

function address_book_address_form(form, form_state, data) {
    form.elements.address_id = {
        type: 'hidden',
        default_value: data.address_id
    };

    form.elements['surname'] = {
        type: 'textfield',
        title: 'Фамилия',
        required: true,
        default_value: typeof data.address.field_ab_surname !== "undefined" && typeof data.address.field_ab_surname['und'] !== "undefined" ? data.address.field_ab_surname['und'][0].safe_value : ''
    };
    form.elements['name'] = {
        type: 'textfield',
        title: 'Имя',
        required: true,
        default_value: typeof data.address.field_ab_name !== "undefined" && typeof data.address.field_ab_name['und'] !== "undefined" ? data.address.field_ab_name['und'][0].safe_value : ''
    };
    form.elements['name2'] = {
        type: 'textfield',
        title: 'Отчество',
        default_value: typeof data.address.field_ab_name2 !== "undefined" && typeof data.address.field_ab_name2['und'] !== "undefined" ? data.address.field_ab_name2['und'][0].safe_value : ''
    };
    form.elements['phone'] = {
        type: 'textfield',
        title: 'Телефон',
        required: true,
        default_value: typeof data.address.field_ab_phone !== "undefined" && typeof data.address.field_ab_phone['und'] !== "undefined" ? data.address.field_ab_phone['und'][0].safe_value : ''
    };
    form.elements['email'] = {
        type: 'textfield',
        title: 'E-Mail',
        required: true,
        default_value: typeof data.address.field_ab_email !== "undefined" && typeof data.address.field_ab_email['und'] !== "undefined" ? data.address.field_ab_email['und'][0].safe_value : Drupal.user.mail
    };
    form.elements['country'] = {
        type: 'textfield',
        title: 'Страна',
        required: true,
        default_value: typeof data.address.field_ab_country !== "undefined" && typeof data.address.field_ab_country['und'] !== "undefined" ? data.address.field_ab_country['und'][0].safe_value : 'Россия'
    };
    form.elements['zipcode'] = {
        type: 'textfield',
        title: 'Индекс',
        required: true,
        default_value: typeof data.address.field_ab_zipcode !== "undefined" && typeof data.address.field_ab_zipcode['und'] !== "undefined" ? data.address.field_ab_zipcode['und'][0].safe_value : ''
    };
    form.elements['region'] = {
        type: 'textfield',
        title: 'Регион',
        required: true,
        default_value: typeof data.address.field_ab_region !== "undefined" && typeof data.address.field_ab_region['und'] !== "undefined" ? data.address.field_ab_region['und'][0].safe_value : ''
    };
    form.elements['area'] = {
        type: 'textfield',
        title: 'Район',
        default_value: typeof data.address.field_ab_area !== "undefined" && typeof data.address.field_ab_area['und'] !== "undefined" ? data.address.field_ab_area['und'][0].safe_value : ''
    };
    form.elements['city'] = {
        type: 'textfield',
        title: 'Населенный пункт',
        required: true,
        default_value: typeof data.address.field_ab_city !== "undefined" && typeof data.address.field_ab_city['und'] !== "undefined" ? data.address.field_ab_city['und'][0].safe_value : ''
    };
    form.elements['street'] = {
        type: 'textfield',
        title: 'Улица',
        default_value: typeof data.address.field_ab_street !== "undefined" && typeof data.address.field_ab_street['und'] !== "undefined" ? data.address.field_ab_street['und'][0].safe_value : ''
    };
    form.elements['house'] = {
        type: 'textfield',
        title: 'Дом',
        default_value: typeof data.address.field_ab_house !== "undefined" && typeof data.address.field_ab_house['und'] !== "undefined" ? data.address.field_ab_house['und'][0].safe_value : ''
    };
    form.elements['app'] = {
        type: 'textfield',
        title: 'Квартира',
        default_value: typeof data.address.field_ab_app !== "undefined" && typeof data.address.field_ab_app['und'] !== "undefined" ? data.address.field_ab_app['und'][0].safe_value : ''
    };
    form.elements['passport'] = {
        type: 'textfield',
        title: 'Паспортные данные',
        default_value: typeof data.address.field_ab_passport !== "undefined" && typeof data.address.field_ab_passport['und'] !== "undefined" ? data.address.field_ab_passport['und'][0].safe_value : ''
    };

    // Buttons
    form.elements['addr_submit'] = {
        type: 'submit',
        value: 'Сохранить адрес',
        options: {
            attributes: {
                class: 'ui-btn ui-btn-raised clr-primary waves-effect waves-button'
            }
        }
    };
    form.buttons['addr_back'] = {
        title: 'Отменить',
        attributes: {
            onclick: "_drupalgap_back()",
            class: 'ui-btn waves-effect waves-button'
        }
    };

    return form;
}

function address_book_address_form_submit(form, form_state) {
    var address_id = form_state.values.address_id;

    var address = {
        type: 'address',
        uid: Drupal.user.uid,
        title: 'Address',
        field_ab_surname:   {und: {0: {value: form_state.values.surname}}},
        field_ab_name:      {und: {0: {value: form_state.values.name}}},
        field_ab_name2:     {und: {0: {value: form_state.values.name2}}},
        field_ab_phone:     {und: {0: {value: form_state.values.phone}}},
        field_ab_email:     {und: {0: {value: form_state.values.email}}},
        field_ab_country:   {und: {0: {value: form_state.values.country}}},
        field_ab_zipcode:   {und: {0: {value: form_state.values.zipcode}}},
        field_ab_region:    {und: {0: {value: form_state.values.region}}},
        field_ab_area:      {und: {0: {value: form_state.values.area}}},
        field_ab_city:      {und: {0: {value: form_state.values.city}}},
        field_ab_street:    {und: {0: {value: form_state.values.street}}},
        field_ab_house:     {und: {0: {value: form_state.values.house}}},
        field_ab_app:       {und: {0: {value: form_state.values.app}}},
        field_ab_passport:  {und: {0: {value: form_state.values.passport}}}
    };

    // если отсутствует, создать новый адрес
    if (address_id == 0) {
        node_create(address, {
            data: JSON.stringify(address),
            success: function () {
                drupalgap_goto(back_link);
            }
        });
    }
    // или сохранить изменения
    else {
        address.nid = address_id;

        node_update(address, {
            data: JSON.stringify(address),
            success: function () {
                drupalgap_goto(back_link);
            }
        });
    }
}