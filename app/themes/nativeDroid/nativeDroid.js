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
                }
            }
        };
      return theme;
    }
    catch (error) { drupalgap_error(error); }
}

