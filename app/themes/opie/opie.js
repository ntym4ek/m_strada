/**
 * Implements DrupalGap's template_info() hook.
 */
function opie_info() {
  try {
    var theme = {
      name: 'opie',
      regions: {
        header: {
          attributes: {
            'data-role': 'header',
            'data-theme': 'b'
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

