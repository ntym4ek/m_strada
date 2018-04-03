var force_authentication_front_page;

/**
 * Use this hook to alter the front page path for authenticated users.
 */
function hook_force_authentication_alter(options, result) {
  try {
    drupalgap.settings.front = 'my_welcome_screen';
  }
  catch (error) { console.log('hook_force_authentication_alter - ' + error); }
}

/**
 * Implements hook_install().
 */
function force_authentication_install() {
  try {
    force_authentication_front_page = drupalgap.settings.front;
  }
  catch (error) { console.log('force_authentication_install - ' + error); }
}

/**
 * Implements hook_services_request_pre_postprocess_alter().
 */
 function force_authentication_services_request_pre_postprocess_alter(options, result) {
  try {
    // On a system connect preprocess, there is no guarantee the Drupal.user
    // object is accurate yet, so we need to look at the user object bundled in
    // the result instead.
    
    // Whenever a system connect is performed, check for anonymous users, if
    // they are anonymous, set the front page to the user login form.
    if (options.service == 'system' && options.resource == 'connect') {
      if (result.user.uid == 0) { drupalgap.settings.front = 'user/login'; }
      else { module_invoke_all('force_authentication_alter', options, result); }
    }
  }
  catch (error) {
    console.log('force_authentication_services_request_pre_postprocess_alter - ' + error);
  }
}

/**
 * Implements hook_services_postprocess().
 */
function force_authentication_services_postprocess(options, result) {
  try {
    var success = function() {
      drupalgap.settings.front = force_authentication_front_page;
      module_invoke_all('force_authentication_alter', options, result);
    }
    // When the user login service resource is successful, set the front page
    // back to its original value.
    if (options.service == 'user') {
      if (options.resource == 'login') { success(); }
      else if (options.resource == 'logout') {
        drupalgap.settings.front = 'user/login';
      }
    }
    else if (options.service == 'fboauth' && options.resource == 'connect') {
      success();
    }
  }
  catch (error) {
    console('force_authentication_services_postprocess - ' + error);
  }
}

