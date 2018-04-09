/**
 * Created by ntym on 18.08.2015.
 */

/**
 * Implements hook_menu().
 */
function stradashop_menu() {
    try {
        var items = {};
        items['catalog'] = {
            title: 'Каталог',
            page_callback: 'strada_catalog_page'
        };
        items['products/%'] = {
            title: 'Препараты',
            page_callback: 'strada_products_page'
        };
        // перекрытие страницы checkout (commerce.js - 50 строка)
        items['checkout/%'] = {
            title: 'Заказ',
            page_callback: 'drupalgap_get_form',
            page_arguments: ['stradashop_commerce_checkout_view', 1]
        };
        items['about-us'] = {
            title: t('About us'),
            page_callback: 'about_us_page'
        };

        return items;
    }
    catch (error) {
        console.log('stradashop_menu - ' + error);
    }
}



// страница О компании
function about_us_page() {
    try {
        var html = '<p>Торговый Дом «Кирово-Чепецкая Химическая Компания» уже более 20 лет предлагает сельхозпроизводителям эффективные средства защиты растений. Фирма успешно работает и в сфере производства препаратов и агрохимикатов для дома и дачи под торговой маркой JOY.</p>'
            + '<p>Продукция торговой марки JOY отличается высоким качеством, привлекательным внешним видом и удобством использования.</p>'
            + '<p>Мы имеем десятилетний опыт успешных продаж, стремимся активно осваивать новые производственные возможности, поддерживать современные тенденции развития и выпускать качественный и полезный продукт.</p>';

        html += '<p>С нашими препаратами Ваш дом станет уютным и красивым, а огород ухоженным и богатым на урожай!</p>';
        html += '<p>Подробную информацию о компании и продукции, а так же оформить заказ и оплатить онлайн можно на нашем сайте</p>'
                + bl('https://joy-magazin.ru', null, {
                        attributes: {
                            onclick: "window.open('https://joy-magazin.ru', '_system', 'location=yes')"
                        }
                    });

        return html;
    }
    catch (error) { console.log('about_us_page - ' + error); }
}

// список категорий
function strada_catalog_page() {
    try {
        var content = {};
        content['stradashop_list'] = {
            theme: 'view',
            format: 'ul',
            path: 'catalog.json',
            row_callback: 'strada_catalog_page_row'
        };
        return content;
    }
    catch (error) { console.log('strada_catalog_page - ' + error); }
}

function strada_catalog_page_row(view, row) {
    try {
        // вернуть html код строки любой категории, кроме "Все продукты"
        var title = '<h2>' + row.name + '</h2>';
        return l(title, 'products/' + row.tid, {
            'attributes': {
                'style': "background: url('" + row.img.src + "') 0 0 no-repeat; background-size: cover;",
                'class': 'catalog-item'
            }
        });
    }
    catch (error) { console.log('strada_catalog_page_row - ' + error); }
}

// список товаров категории
function strada_products_page() {
    try {
        // Grab the collection from the path.
        var category_tid = arg(1);
        if (!category_tid) { category_tid = 'all'; }
        category_tid = encodeURIComponent(category_tid);

        var content = {};
        content['stradashop_list'] = {
            theme: 'view',
            format: 'ul',
            path: 'products.json/' + category_tid,
            row_callback: 'strada_products_page_row',
            empty_callback: 'strada_products_page_empty'
        };
        return content;
    }
    catch (error) { console.log('stradashop_list_page - ' + error); }
}

function strada_products_page_row(view, row) {
    try {
        var card = '<div class="nd2-card card-media-left card-media-medium">'
                + '     <div class="card-media">'
                + '         <img src="' + row.img.src + '">'
                + '     </div>'
                + '     <div class="card-title">'
                + '         <h3 class="card-primary-title">' + row.title + '</h3>'
                + '         <h5 class="card-subtitle">' + row.descr + '</h5>'
                + '     </div>'
                + '     <div class="card-bottom">'
                + '         <h3 class="card-primary-title">' + row.price + '</h3>'
                + '     </div>'
                + '</div>';



        var html = l( card,
            'node/' + row.nid, {
                attributes: {
                    class: 'product-item ui-btn'
                }
            }
        );

        return html;
    }
    catch (error) { console.log('stradashop_list_page_row - ' + error); }
}

function strada_products_page_empty(view) {
    try {
        return "Добавить товары";
    }
    catch (error) { console.log('stradashop_list_page_empty - ' + error); }
}

function stradashop_form_alter(form, form_state) {
    try {
        switch(form.id) {
            // страница подробного описания препарата
            // добавить в форму и вывести поля из Product Variants
            case 'commerce_cart_add_to_cart_form':

                // пересобрать массив атрибутов, собираемый в commerce_cart_add_to_cart_form()
                // в массиве должны быть только атрибуты, по которым меняется commerce_product
                // правка необходима, так как если добавить в commerce_product поле типа Логическое
                // оно тоже окажется в этом массиве и сломает систему выбора атрибутов
                _commerce_product_attribute_field_names = [];
                var field_info_instances = drupalgap_field_info_instances('commerce_product', 'product');
                $.each(field_info_instances, function(field_name, field) {
                    if (
                        typeof field.commerce_cart_settings !== 'undefined' &&
                        typeof field.commerce_cart_settings.attribute_field !== 'undefined'
                         && field.commerce_cart_settings.attribute_field != 0
                    ) {
                        _commerce_product_attribute_field_names.push(field_name);
                    }
                });

                // меняем форму вывода атрибутов
                // добавляем меняемые картинку и цену
                var arguments = form["arguments"];
                var pid = arguments[0].field_product[0];
                _commerce_product_display_product_id = pid;

                var src = arguments[0].field_product_entities[pid].field_p_image_url[0];
                var price = arguments[0].field_product_entities[pid].commerce_price_formatted;
                var fprice = parseFloat(price);
                var short_descr = arguments[0].body.safe_summary;

                // если цена == 0 нужно вывести сообщение вместо неё и запретить добавление товара в корзину
                mprice = fprice ? price : 'Цена товара вскоре будет обновлена';

                form.prefix +=
                      '     <div class="row">'
                    + '         <div class="col-xs-12 col-sm-6 col-md-6 col-lg-6">'
                    + '             <div id="p_image" class="box">'
                    + '                 <img src="' + src + '"/>'
                    + '             </div>'
                    + '         </div>'
                    + '         <div class="col-xs-12 col-sm-6 col-md-6 col-lg-6">'
                    + '             <div class="box">';
                form.suffix +=
                      '                 <div class="short_descr">' + short_descr + '</div>'
                    + '                 <div id="p_price" class="price">Цена: <b>' + mprice + '</b></div>'
                    + '             </div>'
                    + '         </div>'
                    + '     </div>';


                // зададим значение по умолчанию для Тары
                var def = count = 0;
                for (var key in form.elements['field_p_tare']['ru'][0].options) {
                    if (!isNaN(parseInt(key))) {
                        def = def ? def : key;
                        count++;
                    }
                }
                if (count > 1) {
                    form.elements['field_p_tare']['ru'][0]['value'] = key;
                    form.elements.field_p_tare.title = '';
                } else form.elements.field_p_tare.access = false;

                // кнопка добавления в корзину
                form.elements.submit.access = false;
                form.elements.submit.value = 'В корзину';
                form.elements.submit.options.attributes.class = 'ui-btn ui-btn-raised clr-primary waves-effect waves-button';
                if (!fprice) form.elements.submit.disabled = true;

                break;
            case 'user_login_form':
                // добавить комментарий
                var elements = {};
                //elements.intro = {
                //    markup: '<div class="intro">Для работы с приложением необходимо войти под своей учетной записью или зарегистрироваться.</div>'
                //};
                elements.name = form.elements.name;
                elements.pass = form.elements.pass;
                elements.submit = form.elements.submit;
                elements.submit.options.attributes.class = 'ui-btn ui-btn-raised clr-primary waves-effect waves-button';

                //dpm(form.elements);
                form.elements = elements;

                // изменить подпись в поле Логин
                if (typeof drupalgap.site_settings.logintoboggan_login_with_email !== 'undefined' &&
                    drupalgap.site_settings.logintoboggan_login_with_email == "1" ) {
                    form.elements['name'].title = t('E-mail address');
                }
                break;
            case 'user_register_form':
                // убрать с формы регистрации Имя и при сабмите задать его значение равным Email
                form.elements['name'].type = 'hidden';
                form.elements['name'].required = false;
                //dpm(form);
                form.elements.submit.options.attributes.class = 'ui-btn ui-btn-raised clr-primary waves-effect waves-button';
                form.submit.unshift('stradashop_user_register_form_submit');
                break;
        }
    }
    catch (error) {
        console.log('stradashop_form_commerce_cart_add_to_cart_form_alter - ' + error);
    }
}


// перекрытие функции из commerce.js (строка 824)
// при смене атрибутов меняем цену и картинку
function _commerce_cart_attribute_change() {
    try {
        var pid = _commerce_product_display_get_current_product_id();
        _commerce_product_display_product_id = pid;
        $('#p_price').html('<b>Цена: </b>' + _commerce_product_display['field_product_entities'][pid]['commerce_price_formatted']);
        $('#p_image').html('<img src="' + _commerce_product_display['field_product_entities'][pid]['field_p_image_url'][0] + '" />');
    }
    catch (error) { console.log('_commerce_cart_attribute_change - ' + error); }
}

///**
// * Creates a commerce_customer_profile.
// * @param {Object} options
// */
//function stradashop_commerce_customer_profile_create(options) {
//    try {
//        options.method = 'POST';
//        options.contentType = 'application/x-www-form-urlencoded';
//        options.path = 'commerce_customer_profile.json';
//        if (typeof options.flatten_fields !== 'undefined' && options.flatten_fields === false) {
//            options.path += '&flatten_fields=false';
//        }
//        options.service = 'commerce_customer_profile';
//        options.resource = 'create';
//        // Since the service resource is expecting URL encoded data, change the data
//        // object into a string.
//        if (options.data) {
//            var data = '';
//            for (var property in options.data) {
//                if (options.data.hasOwnProperty(property)) {
//                    data += property + '=' + options.data[property] + '&';
//                }
//            }
//            // Remove last ampersand.
//            if (data != '') {
//                data = data.substring(0, data.length - 1);
//                options.data = data;
//            }
//        }
//        Drupal.services.call(options);
//    }
//    catch (error) { console.log('stradashop_commerce_customer_profile_create - ' + error); }
//}

/**
 * create a commerce_customer_profile.
 * @param {Object} profile
 * @param {Object} options
 */
function stradashop_commerce_customer_profile_create(profile, options) {
    try {
        services_resource_defaults(options, 'commerce_customer_profile', 'create');
        entity_create('commerce_customer_profile', profile.type, profile, options);
    }
    catch (error) { console.log('stradashop_commerce_customer_profile_create - ' + error); }
}

/**
 * Update a commerce_customer_profile.
 * @param {Object} profile
 * @param {Object} options
 */
function stradashop_commerce_customer_profile_update(profile, options) {
    try {
        services_resource_defaults(options, 'commerce_customer_profile', 'update');
        entity_update('commerce_customer_profile', profile.type, profile, options);
    }
    catch (error) { console.log('stradashop1_commerce_customer_profile_update - ' + error); }
}

/**
 * обновление заказа через Services
 */
function stradashop_order_update(options) {
    try {
        options.method = 'PUT';
        options.path = 'order/' + options.order_id;
        options.service = 'order';
        options.resource = 'update';
        Drupal.services.call(options);
    }
    catch (error) { console.log('stradashop_order_update - ' + error); }
}

/**
 *
 */
function stradashop_commerce_checkout_complete_view_pageshow(order_id) {
    try {
        commerce_checkout_complete({
            data: { order_id: order_id },
            success: function(result) {
                var checkout_complete_html = '<div>Номер заказа: ' + order_id + '.<br/> Менеджер свяжется с Вами в ближайшее время.</div>';
                $('#commerce_checkout_complete_' + order_id).html(checkout_complete_html).trigger('create');
            }
        });
    }
    catch (error) {
        console.log('stradashop_commerce_checkout_complete_view_pageshow - ' + error);
    }
}



/*******************************
 *
 * THEMES
 * оформление контента
 *
 ******************************/

/**
 * Implements hook_locale() - локализация модуля
 */
function stradashop_locale() {
    return ['ru'];
}

/**
 * Implements hook_deviceready().
 * позволяет менять элеметны отрендеренных страницы
 */
function stradashop_deviceready() {
    try {
        // страница завершения заказа (Checkout Complete)
            // Меняем заголовок
        drupalgap.menu_links['checkout/complete/%'].title = 'Заказ оформлен';
            // меняем content pageshow callback на свой
        drupalgap.menu_links['checkout/complete/%'].pageshow = 'stradashop_commerce_checkout_complete_view_pageshow';
            // обновлять корзину каждый раз
        drupalgap.menu_links['cart'].options.reloadPage = true;

        //document.addEventListener("backbutton", function(e){
        //    var active_page_id = $('.ui-page-active').attr('id');
        //
        //    dpm($.mobile.activePage);
        //    dpm(active_page_id);
        //    dpm(drupalgap.settings.front);
        //    drupalgap_back();
        //    //if($.mobile.activePage.is('#homepage')){
        //    //    /*
        //    //     Event preventDefault/stopPropagation not required as adding backbutton
        //    //     listener itself override the default behaviour. Refer below PhoneGap link.
        //    //     */
        //    //    //e.preventDefault();
        //    //    navigator.app.exitApp();
        //    //}
        //    //else {
        //    //    navigator.app.backHistory()
        //    //}
        //}, false);

    }
    catch (error) { console.log('stradashop_deviceready - ' + error); }
}

/**
 * Theme a commerce cart. (темизация корзины, перекрытие функции из commerce.js с.1494)
 */
function theme_commerce_cart(variables) {
    try {
        // вернуть настройки после входа или регистрации
        drupalgap.settings.front = 'catalog';

        var html = '';

        // Determine how many line items are in the cart.
        var item_count = 0;
        if (variables.order.commerce_line_items) {
            item_count = variables.order.commerce_line_items.length;
        }
        if (item_count == 0) { return 'Вы не добавили ни одного препарата.'; }

        // Render each line item.
        var items = [];
        $.each(variables.order.commerce_line_items_entities, function(line_item_id, line_item) {
            if (line_item.type != 'shipping') {
                var item = theme('commerce_cart_line_item', {
                    line_item: line_item,
                    order: variables.order
                });
                html += item;
            }
            // если по какой-то причине при рендере корзины в заказе присутствует item с доставкой - удалить
            else {
                _commerce_cart_line_item_remove(variables.order.order_id, line_item_id);
            }
        });


        // Render the order total and the buttons.
        html += theme('commerce_cart_total', { order: variables.order });

        // если пользователь авторизован, вывести кнопку заказа
        var aid = variables.order.commerce_customer_shipping;
        var pid = aid ? variables.order.commerce_customer_shipping_entities[aid].field_ship_address : 0;

        if (Drupal.user.uid != 0) {
            html += theme('button_link', {
                text: 'Заказать',
                //path: 'checkout/' + variables.order.order_id,
                path: 'address-book/open/stradashop/' + variables.order.order_id + '/' + pid,
                options: {
                    attributes: {
                        class: 'ui-btn ui-btn-raised clr-primary waves-effect waves-button',
                        'data-icon': 'check'
                    }
                }
            });
        }
        // если аноним - кнопки входа/регистрации
        else {
            // после входа или регистрации вернуться в корзину
            drupalgap.settings.front = 'cart';
            html += '<div style="text-align: center;">Для оформления заказа необходимо</div>';
            html += theme('button_link', {
                text: 'Войти / Зарегистрироваться',
                path: 'user/login',
                options: {
                    attributes: {
                        class: 'ui-btn ui-btn-raised clr-primary waves-effect waves-button',
                        'data-icon': 'user'
                    }
                }
            });
        }

        // Return the rendered cart.
        return html;
    }
    catch (error) { console.log('theme_commerce_cart - ' + error); }
}

/**
 * Themes a commerce cart line item.
 * перекрытие функции из commerce.js
 */
function theme_commerce_cart_line_item(variables) {
    try {
        var id = 'commerce_cart_line_item_quantity_' + variables.line_item.line_item_id;
        var attributes = {
            type: 'text',
            id: id,
            value: Math.floor(variables.line_item.quantity),
            line_item_id: variables.line_item.line_item_id,
            'data-wrapper-class': 'controlgroup-textinput ui-btn',
            onblur: 'commerce_cart_button_update_click(' + variables.order.order_id + ')'
        };

        var item = variables.line_item;

        var html = '<div class="nd2-card">'
            + '         <div class="card-title has-supporting-text">'
            + '             <h3 class="card-primary-title">' + item.line_item_title + '</h3>'
            + '             <a href="#" onclick = "_commerce_cart_line_item_remove(' + variables.order.order_id + ', ' + variables.line_item.line_item_id + ');" class="delete ui-btn ui-btn-inline waves-effect waves-button" ><i class="zmdi zmdi-close"></i></a>'
            + '         </div>'
            + '         <div class="card-action">'
            + '             <div class="row between-xs">'
            + '                 <div class="col-xs-6">'
            + '                     <div class="box">'
            + '                         <a href="#" onclick = "_stradashop_cart_qty_update(\'dec\',' + variables.line_item.line_item_id + ',' + variables.order.order_id + ');" class="l-btn ui-btn ui-btn-inline waves-effect waves-button"><i class="zmdi zmdi-minus"></i></a>'
            + '                         <input ' +  drupalgap_attributes(attributes) + ' />'
            + '                         <a href="#" onclick = "_stradashop_cart_qty_update(\'inc\',' + variables.line_item.line_item_id + ',' + variables.order.order_id + ');" class="r-btn ui-btn ui-btn-inline waves-effect waves-button"><i class="zmdi zmdi-plus"></i></a>'
            + '                     </div>'
            + '                 </div>'
            + '                 <div class="col-xs-6">'
            + '                     <div class="box total-price">'
            + '                         ' + item.commerce_total_formatted
            + '                     </div>'
            + '                 </div>'
            + '             </div>'
            + '         </div>'
            + '     </div>';

        return html;
    }
    catch (error) { console.log('theme_commerce_cart_line_item - ' + error); }
}

/**
 * Theme a commerce cart total.
 * перекрытие функции из commerce.js
 */
function theme_commerce_cart_total(variables) {
    try {
        var total = 0;
        $.each(variables.order.commerce_line_items_entities, function(line_item_id, line_item) { dpm
            if (line_item.type != 'shipping') {
                total += line_item.commerce_total.amount/100;
            }
        });

        return '<h3 class="ui-bar ui-bar-a ui-corner-all">Итого: ' + total.toFixed(2) + ' руб.' + '</h3>';
    }
    catch (error) { console.log('theme_commerce_cart_total - ' + error); }
}

/*
* изменить значение поля "Количество" и обновить корзину
*/
function _stradashop_cart_qty_update(op, item_id, order_id){
    var val = $('#commerce_cart_line_item_quantity_' + item_id).val();
    if (op == 'inc') $('#commerce_cart_line_item_quantity_' + item_id).val(++val);
    else if (val>1) $('#commerce_cart_line_item_quantity_' + item_id).val(--val);

    commerce_cart_button_update_click(order_id);
}

/*
* очистить корзину пользователя
*/
function stradashop_commerce_cart_clear(options){
    commerce_cart_clear({
        success: function() {
        }
    });
    var html = 'Корзина очищена.';
    $('#commerce_cart').html(html).trigger('create');
}

/*
* очистить корзину пользователя
*/
function commerce_cart_clear(options){
    try {
        options.method = 'POST';
        options.path = 'services_mobile_app_resources/clear_cart.json';
        options.service = 'services_mobile_app';
        options.resource = 'clear_cart';
        Drupal.services.call(options);
    }
    catch (error) {
        console.log('stradashop_commerce_cart_clear - ' + error);
    }
}


/**
 * Implements hook_node_page_view_alter_TYPE().
 * изменение отрендеренной ноды
 */
function stradashop_node_page_view_alter_product(node, options) {
    try {
        // выведем контент без title
        options.success(node.content);
    }
    catch (error) { console.log('stradashop_node_page_view_alter_product - ' + error); }
}

/***********************************
 *
 * Slide menu
 *
 **********************************/

/**
 * Implements hook_block_info().
 */
function stradashop_block_info() {
    try {
        var blocks = {};
        blocks['menu_panel_block'] = {
            delta: 'menu_panel_block',
            module: 'stradashop'
        };
        blocks['menu_panel_block_button'] = {
            delta: 'menu_panel_block_button',
            module: 'stradashop'
        };
        blocks['menu_block_buttons'] = {
            delta: 'menu_block_buttons',
            module: 'stradashop'
        };
        return blocks;
    }
    catch (error) { console.log('stradashop_block_info - ' + error); }
}

/**
 * Implements hook_block_view().
 */
function stradashop_block_view(delta, region) {
    try {
        var content = '';
        switch (delta) {

            // The slide menu (aka panel).
            case 'menu_panel_block':
                var attrs = {
                    id: drupalgap_panel_id(delta),
                    'data-role': 'panel',
                    'data-position': 'left',
                    'data-display': 'overlay',
                    'data-position-fixed': 'true'
                };
                if (Drupal.user.uid == 0) {
                    var items = [
                        bl('<i class="zmdi zmdi-format-list-bulleted"></i>' + '&nbsp;&nbsp;&nbsp;' + t('Catalog'), 'catalog', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        bl('<i class="zmdi zmdi-info-outline"></i>' + '&nbsp;&nbsp;&nbsp;' + t('About us'), 'about-us', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        // bl('<i class="zmdi zmdi-account-add"></i>' + '&nbsp;&nbsp;&nbsp;' +  t('Register'), 'user/register', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        // bl('<i class="zmdi zmdi-sign-in"></i>' + '&nbsp;&nbsp;&nbsp;' +  t('Login'), 'user/login', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        bl('<i class="zmdi zmdi-close"></i>' + '&nbsp;&nbsp;&nbsp;' +  'Выйти из приложения', '#', { attributes: { class: 'ui-btn waves-effect waves-button', onclick: '_drupalgap_back_exit(1);'}})
                    ];
                } else {
                    var items = [
                        bl('<i class="zmdi zmdi-format-list-bulleted"></i>' + '&nbsp;&nbsp;&nbsp;' +  t('Catalog'), 'catalog', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        bl('<i class="zmdi zmdi-info-outline"></i>' + '&nbsp;&nbsp;&nbsp;' + t('About us'), 'about-us', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        // bl('<i class="zmdi zmdi-shopping-basket"></i>' + '&nbsp;&nbsp;&nbsp;' +  t('Shopping cart'), 'cart', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        // bl('<i class="zmdi zmdi-account"></i>' + '&nbsp;&nbsp;&nbsp;' +  t('My account'), 'user', { attributes: { class: 'ui-btn waves-effect waves-button'}}),
                        bl('<i class="zmdi zmdi-close"></i>' + '&nbsp;&nbsp;&nbsp;' +  'Выйти из приложения', '#', { attributes: { class: 'ui-btn waves-effect waves-button', onclick: '_drupalgap_back_exit(1);'}})
                    ];
                }
                content +=" <div " + drupalgap_attributes(attrs) + ">"
                    + "         <div class='panel-logo wow fadeInDown'>"
                    + "             <img src='app/themes/nativeDroid/images/logo.jpg' />"
                    + "         </div>"
                    +           theme('jqm_item_list', { items: items })
                    + "     </div>";

                break;

            // The button to open the menu.
            case 'menu_panel_block_button':
                content = bl('', '#' + drupalgap_panel_id('menu_panel_block'), {
                    attributes: {
                        class: 'ui-btn ui-btn-left zmdi zmdi-menu wow fadeIn',
                        'data-wow-delay': '0.8s'
                    }
                });
                // Attach a swipe listener for the menu.
                var page_id = drupalgap_get_page_id();
                content += drupalgap_jqm_page_event_script_code({
                    page_id: page_id,
                    jqm_page_event: 'pageshow',
                    jqm_page_event_callback: 'stradashop_menu_panel_block_swiperight',
                    jqm_page_event_args: JSON.stringify({
                        page_id: page_id
                    })
                });
                break;

            // The button to open the menu.
            case 'menu_block_buttons':
                if (drupalgap_path_get() != drupalgap.settings.front) {
                    content += bl('', '#', {
                        attributes: {
                            class: 'ui-btn ui-btn-right ui-btn-right zmdi zmdi-mail-reply wow fadeIn waves-effect waves-button',
                            'data-wow-delay': '0.8s',
                            onclick: 'javascript:drupalgap_back();'
                        }
                    });
                }
                // if (drupalgap_router_path_get() != 'cart') {
                //     content += bl('', '#', {
                //         attributes: {
                //             class: 'ui-btn ui-btn-right zmdi zmdi-shopping-basket wow fadeIn waves-effect waves-button',
                //             'data-wow-delay': '0.8s',
                //             onclick: "javascript:drupalgap_goto('cart', {reloadPage: true});"
                //         }
                //     });
                // } else {
                //     content += bl('', '#', {
                //         attributes: {
                //             class: 'ui-btn ui-btn-right zmdi zmdi-delete wow fadeIn waves-effect waves-button',
                //             'data-wow-delay': '0.8s',
                //             onclick: 'stradashop_commerce_cart_clear();'
                //         }
                //     });
                // }
                break;
        }
        return content;
    }
    catch (error) { console.log('stradashop_block_view - ' + error); }
}

/**
 *  menu swipe right callback function
 */
function stradashop_menu_panel_block_swiperight(options) {
    try {
        $.extend($.event.special.swipe,{
            scrollSupressionThreshold: 10, // More than this horizontal displacement, and we will suppress scrolling.
            durationThreshold: 1000, // More time than this, and it isn't a swipe.
            horizontalDistanceThreshold: 30,  // Swipe horizontal displacement must be more than this.
            verticalDistanceThreshold: 75  // Swipe vertical displacement must be less than this.
        });

        $('#' + options.page_id).on('swiperight', function(event) {
            $('#' + options.page_id + ' .region_header .my_panel_block_button_icon').click();
        });
    }
    catch (error) { console.log('my_panel_block_swiperight - ' + error); }
}

// установить имя пользователя равным его email
function stradashop_user_register_form_submit(form, form_state) {
    form_state.values.name = form_state.values.mail;
    //dpm(form_state);
}


/**
 *   перекрытие стандартной функции commerce.js (ст. 220)
 *   вывод сообщения для анонимов без добавленных товаров
 */
function commerce_cart_view_pageshow() {
    try {
        commerce_cart_index(null, {
            success: function(result) {
                if (result.length != 0) {
                    $.each(result, function(order_id, order) {
                        // Set aside the order so it can be used later without fetching
                        // it again.
                        _commerce_order[order_id] = order;
                        // Theme the cart and render it on the page.
                        var html = theme('commerce_cart', { order: order });
                        $('#commerce_cart').html(html).trigger('create');
                        return false; // Process only one cart.
                    });
                } else {
                    // добавить сообщение в корзине
                    var html = 'Вы не добавили ни одного препарата.';
                    $('#commerce_cart').html(html).trigger('create');
                }
            }
        });
    }
    catch (error) { console.log('covered! commerce_cart_view_pageshow - ' + error); }
}

function commerce_customer_profile_primary_key() {
    return 'profile_id';
}

/**
 *   функция, вызываемая адресной книгой при выборе адреса
 *   если АК вызвана из этого модуля
 */
function stradashop_address_book_submit(order_id, address_id) {
    var order = _commerce_order[order_id];
    // order.commerce_customer_shipping обычно число - id профиля, но при возврате со страницы доставки к выбору адреса - становится объектом
    if (typeof order.commerce_customer_shipping == 'object' && order.commerce_customer_shipping) {
        var profile_id = order.commerce_customer_shipping['und'][0]['profile_id'];
    }
    else var profile_id = order.commerce_customer_shipping;

    var profile = {
        type: 'shipping',
        uid: Drupal.user.uid,
        field_ship_address: {und: {0: {value: address_id}}}
    };

    // создать профиль, если отсутствует
    if (!profile_id) {
        stradashop_commerce_customer_profile_create(profile, {
            data: JSON.stringify(profile),
            success: function (result) {
                // в случае успешного создания профиля, привязываем его к заказу
                order['commerce_customer_shipping'] = {
                    und: {0: {profile_id: result['profile_id']}}
                };
                stradashop_order_update({
                    order_id: order_id,
                    data: JSON.stringify(order),
                    success: function (result) { dpm('order result:');dpm(result);
                        drupalgap_goto('shipping/' + order_id);
                    }
                });
            }
        });
    } else {
        // обновить shipping профиль
        profile.profile_id = profile_id;

        var options = {};
        stradashop_commerce_customer_profile_update(profile, {
            data: JSON.stringify(options),
            success: function () {
                drupalgap_goto('shipping/' + order_id);
            }
        });
    }
}
