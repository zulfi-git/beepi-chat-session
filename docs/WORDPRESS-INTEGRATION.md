# WordPress ChatKit Integration

This guide shows how to integrate the ChatKit widget into your WordPress site using the token service.

## Prerequisites

- Deployed ChatKit Token Service on Cloudflare Workers
- WordPress site with admin access
- Worker URL (e.g., `https://chatkit-token-service.your-subdomain.workers.dev`)

---

## Method 1: Add to Theme

Add this code to your theme's `footer.php` or use the `wp_footer` action hook:

```html
<!-- ChatKit Integration -->
<script type="module">
  // Configuration - Update with your deployed Worker URL
  const CHATKIT_WORKER_URL = 'https://chatkit-token-service.your-subdomain.workers.dev';
  
  // Session management
  let currentSession = null;
  
  /**
   * Get or refresh ChatKit client secret
   * This function is called by ChatKit when it needs authentication
   */
  async function getClientSecret() {
    const now = Math.floor(Date.now() / 1000);
    
    // Return cached token if still valid (with 60s buffer)
    if (currentSession && currentSession.expires_at > now + 60) {
      console.log('ChatKit: Using cached token');
      return currentSession.client_secret;
    }
    
    try {
      // Determine endpoint (refresh vs. start)
      const endpoint = currentSession 
        ? '/api/chatkit/refresh' 
        : '/api/chatkit/start';
        
      const body = currentSession 
        ? JSON.stringify({ currentClientSecret: currentSession.client_secret })
        : '{}';
      
      console.log('ChatKit: Requesting token from', endpoint);
      
      // Request token from Worker
      const response = await fetch(CHATKIT_WORKER_URL + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('ChatKit: Token error', error);
        throw new Error(error.message || 'Failed to get token');
      }
      
      currentSession = await response.json();
      console.log('ChatKit: Token received, expires at', new Date(currentSession.expires_at * 1000));
      
      return currentSession.client_secret;
    } catch (error) {
      console.error('ChatKit: Error getting token', error);
      throw error;
    }
  }
  
  /**
   * Initialize ChatKit widget
   */
  async function initializeChatKit() {
    try {
      // Import ChatKit from CDN
      const { renderChatkit } = await import('https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/index.js');
      
      console.log('ChatKit: Initializing widget');
      
      // Render ChatKit with authentication
      renderChatkit({
        getClientSecret: getClientSecret,
        
        // Optional: Customize ChatKit appearance
        // theme: 'light',
        // position: 'bottom-right',
        
        // Optional: Custom container
        // container: document.getElementById('chatkit-container'),
        
        // Optional: Event handlers
        onOpen: () => {
          console.log('ChatKit: Widget opened');
        },
        onClose: () => {
          console.log('ChatKit: Widget closed');
        },
        onError: (error) => {
          console.error('ChatKit: Error', error);
        },
      });
      
      console.log('ChatKit: Widget initialized successfully');
    } catch (error) {
      console.error('ChatKit: Initialization error', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatKit);
  } else {
    initializeChatKit();
  }
</script>
```

---

## Method 2: Custom Plugin

Create a custom plugin file (e.g., `wp-content/plugins/chatkit-integration/chatkit-integration.php`):

```php
<?php
/**
 * Plugin Name: ChatKit Integration
 * Description: Integrates OpenAI ChatKit with token service
 * Version: 1.1.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add ChatKit script to footer
 */
function chatkit_add_scripts() {
    // Only load on frontend
    if (is_admin()) {
        return;
    }
    
    // Get Worker URL from WordPress options or define it here
    $worker_url = get_option('chatkit_worker_url', 'https://your-worker.workers.dev');
    
    ?>
    <script type="module">
      const CHATKIT_WORKER_URL = '<?php echo esc_js($worker_url); ?>';
      let currentSession = null;
      
      async function getClientSecret() {
        const now = Math.floor(Date.now() / 1000);
        if (currentSession && currentSession.expires_at > now + 60) {
          return currentSession.client_secret;
        }
        
        const endpoint = currentSession ? '/api/chatkit/refresh' : '/api/chatkit/start';
        const body = currentSession 
          ? JSON.stringify({ currentClientSecret: currentSession.client_secret })
          : '{}';
        
        const response = await fetch(CHATKIT_WORKER_URL + endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
        });
        
        if (!response.ok) throw new Error('Failed to get token');
        currentSession = await response.json();
        return currentSession.client_secret;
      }
      
      async function init() {
        const { renderChatkit } = await import('https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/index.js');
        renderChatkit({ getClientSecret });
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    </script>
    <?php
}
add_action('wp_footer', 'chatkit_add_scripts');

/**
 * Add settings page (optional)
 */
function chatkit_add_settings_page() {
    add_options_page(
        'ChatKit Settings',
        'ChatKit',
        'manage_options',
        'chatkit-settings',
        'chatkit_settings_page'
    );
}
add_action('admin_menu', 'chatkit_add_settings_page');

function chatkit_settings_page() {
    if (isset($_POST['chatkit_worker_url'])) {
        check_admin_referer('chatkit_settings');
        update_option('chatkit_worker_url', sanitize_text_field($_POST['chatkit_worker_url']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $worker_url = get_option('chatkit_worker_url', '');
    ?>
    <div class="wrap">
        <h1>ChatKit Settings</h1>
        <form method="post">
            <?php wp_nonce_field('chatkit_settings'); ?>
            <table class="form-table">
                <tr>
                    <th><label for="chatkit_worker_url">Worker URL</label></th>
                    <td>
                        <input type="url" 
                               id="chatkit_worker_url" 
                               name="chatkit_worker_url" 
                               value="<?php echo esc_attr($worker_url); ?>" 
                               class="regular-text" 
                               placeholder="https://your-worker.workers.dev">
                        <p class="description">Your Cloudflare Worker URL for ChatKit token service</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
```

---

## Configure CORS

**Important:** Configure your WordPress domain in `ALLOWED_ORIGINS` in your Cloudflare Worker's `wrangler.toml` file.

```toml
# Edit wrangler.toml and add your allowed origins under [vars]:
[vars]
ALLOWED_ORIGINS = "https://yourwordpresssite.com,https://www.yourwordpresssite.com"

# Then redeploy:
npm run deploy
```

---

## Testing

1. Load your WordPress site in a browser
2. Open the browser's Developer Console (F12)
3. Look for ChatKit initialization logs
4. The ChatKit widget should appear on your page
5. Test chatting to verify tokens are working

---

## Troubleshooting

### ChatKit doesn't appear

- Check browser console for errors
- Verify Worker URL is correct
- Ensure ChatKit CDN is accessible
- Check for JavaScript conflicts with other plugins

### CORS errors

- Verify `ALLOWED_ORIGINS` in `wrangler.toml` under `[vars]` includes your domain
- Check that domain matches exactly (https vs http, www vs non-www)
- Test CORS with: `curl -X OPTIONS https://your-worker.workers.dev/api/chatkit/start -H "Origin: https://yoursite.com" -v`

### "Failed to get token" errors

- Verify Worker secrets are set correctly
- Check OpenAI API key is valid
- View Worker logs: `wrangler tail`
- Ensure you have Realtime API access

---

**Success!** Your WordPress site now has ChatKit integrated with secure token management through your Cloudflare Worker.
