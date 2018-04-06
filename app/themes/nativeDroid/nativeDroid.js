/**
 * Implements DrupalGap's template_info() hook.
 */
function nativeDroid_info() {
    try {
        var theme = {
            name: 'nativeDroid',
            regions: {
                header: {
                    attributes: {
                        'data-role': 'header',
                        'data-position': 'fixed',
                        'data-wow-delay': '0.2s',
                        class: "wow fadeInDown"
                    }
                },
                content: {
                    attributes: {
                        'class': 'ui-content',
                        'role': 'main'
                    }
                },
                footer: {
                    attributes: {
                        'data-role': 'footer',
                        'data-position': 'fixed',
                        'data-theme': 'b'
                    }
                }
            }
        };
      return theme;
    }
    catch (error) { drupalgap_error(error); }
}

/**
 * Implements hook_TYPE_tpl_html().
 */
function nativeDroid_page_tpl_html() {
    return '<div {:drupalgap_page_attributes:}>' +
        '{:header:}' +
        '{:content:}' +
        '</div>';
}

/**
 * Implements hook_TYPE_tpl_html().
 */
function nativeDroid_node_tpl_html() {
    return '<h2>{:title:}</h2>' +
        '<div>{:content:}</div>';
}

/**
 * Implements hook_TYPE_tpl_html().
 */
function nativeDroid_user_profile_tpl_html() {
    return '<h2>{:name:}</h2>' +
        '<div>{:created:}</div>' +
        '<div class="user-picture">{:picture:}</div>' +
        '<div>{:content:}</div>';
}


