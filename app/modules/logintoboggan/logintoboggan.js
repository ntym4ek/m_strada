/**
 * Implements hook_form_alter().
 */
function logintoboggan_form_alter(form, form_state, form_id) {
  try {
    if (form_id == 'user_login_form') {
      // If the login with e-mail setting is enabled, change the label on the
      // name field.
      if (
        typeof drupalgap.site_settings.logintoboggan_login_with_email !== 'undefined' &&
        drupalgap.site_settings.logintoboggan_login_with_email == "1"
      ) {
        form.elements['name'].title = 'Username or e-mail';
        form.elements['name'].type = 'email';
      }
    }
    else if (form_id == 'user_register_form') {
      // If the confirm e-mail at registration setting is disabled, disable the
      // confirm e-mail field on the form.
      if (
        typeof drupalgap.site_settings.logintoboggan_confirm_email_at_registration !== 'undefined' &&
        drupalgap.site_settings.logintoboggan_confirm_email_at_registration == "0" &&
        typeof form.elements['conf_mail'] !== 'undefined'
      ) {
        form.elements['conf_mail'].access = false;
        form.elements['conf_mail'].required = false;
      }
    }
  }
  catch (error) { console.log('logintoboggan_form_alter - ' + error); }
}

