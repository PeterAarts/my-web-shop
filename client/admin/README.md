# admin

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
Using the Admin-Site as ShopOwner :
Your Webshop Owner's Guide: Getting Started & Daily Operations
Welcome to your new webshop! This guide will walk you through the essential day-to-day tasks of managing your products, processing orders, and configuring your shop through your dedicated Admin Panel.

1. Getting Started: Logging In & The Dashboard
Your Admin Panel is your command center. You can access it by navigating to [YourDomain.com]/admin and logging in with the credentials provided.

The first page you will see is the Dashboard. It gives you a high-level overview of your business at a glance, including:

Key Statistics: Total products, registered users, and recent sales figures.

Sales Activity Chart: A visual graph of your sales and orders over the last 30 days.

Recent Orders: A list of the most recent orders that have come in, allowing you to quickly see new activity.

2. Managing Your Products
The Products section is where you will spend a lot of your time, adding and managing your inventory.

Creating a New Product Manually
Navigate to Products from the left-hand sidebar.

Click the "Add New Product" button.

Fill in the product details:

Name & Description: The title and detailed description for your product.

Price: The selling price.

Images: Upload one or more high-quality images. The first image is typically the main one.

Stock Quantity: The number of items you have available. The shop will automatically track this.

Category: Assign the product to a category to help customers find it.

Weight & Dimensions: These are crucial for calculating shipping rates accurately.

Click "Save Product". It will now be live in your shop.

Importing Products in Bulk (from Etsy/Shopify)
To get started quickly, you can import products from a CSV file you've exported from another platform like Etsy or Shopify.

Navigate to Products and click the "Import Products" button.

A modal window will appear.

Select the source of your file (e.g., Etsy).

Upload your CSV file.

The system will show you a preview of the products to be imported. You can uncheck any you wish to skip.

Click "Import Products" to complete the process.

3. Organizing with Categories
Categories help customers navigate your shop and find related products.

Navigate to Categories from the sidebar.

Click "Add New Category".

Enter a Name for the category (e.g., "Vintage Postcards", "Craft Supplies").

Click "Save".

You can now assign products to this new category when you create or edit them.

4. Engaging with Stories (Content Management)
The Stories section is your built-in blog. You can use it for announcements, articles, or to share the story behind your products.

Navigate to Stories from the sidebar.

Click "Create New Story".

Fill in the Title and the main Body content. You can add images to make it more engaging.

The system will automatically create a URL-friendly "slug" from the title. This slug determines the story's web address (e.g., a story titled "My First Post" will have a URL like [YourDomain.com]/stories/my-first-post).

When you publish the story, it will appear on the "Stories" or "Blog" section of your main shop website.

5. Processing Customer Orders (The Core Workflow)
This is the most important part of your daily operations. The system is designed to make it as smooth as possible.

Step 1: A New Order Arrives
New orders will appear at the top of the list in the Orders section of the admin panel. The status will typically be Pending Payment (for bank transfers) or Received (for direct online payments).

Step 2: Review and Prepare the Order
Click on an order to view its details, including the items purchased and the customer's shipping address. At this stage, you should physically pick the items and pack them for shipment.

Step 3: Create the Shipping Label

In the orders list, find the order you have packed.

Click the "Create Label" button (a tag icon) in the "Actions" column.

A modal will pop up, showing the available shipping rates for the package's weight and destination. Select the desired shipping option.

Click "Confirm & Create". The system will connect to the shipping provider (e.g., PostNL), generate the label, and automatically save it.

The order's status will automatically update to Ready for Shipment.

Step 4: Print and Ship

After creating the label, a "View Label" button (a printer icon) will appear. Click this to open the label as a PDF in a new tab.

Print the label and attach it to your package.

Hand the package over to the courier (e.g., drop it off at a PostNL point).

Step 5: Mark as Shipped

Go back to the order details in the admin panel.

Manually change the order status to Shipped.

Click "Save Changes".

This is the final step! The system will now automatically send the "Order Shipped" email to the customer.

6. Configuring Your Shop Settings
The Settings section is the control panel for your shop's business rules. Here you can configure things like:

Bank Transfer Details: The instructions and account information shown to customers who choose this payment method.

Order Archiving: Set rules to automatically archive old, completed orders to keep your main view clean (e.g., archive all "shipped" orders after 90 days).

Shipping Packages: Define the sizes and maximum weights of the boxes you use for shipping. This is essential for accurate rate calculation.

7. Managing Email Notifications
Your shop sends automatic emails to customers at key moments. In the E-mail templates section, you can view and edit the content of these emails.

You can change the Subject and Body (HTML) of templates like "Order Confirmation" and "Order Shipped".

The templates use variables (e.g., <%= order.orderNumber %>) to automatically insert the correct customer and order details.

This allows you to customize the communication your customers receive, all without needing to touch any code.

This guide covers the main functions of your shop. We encourage you to explore the admin panel and familiarize yourself with these powerful tools.

### Directory Structure
````
admin
index.html
�   jsconfig.json
�   package-lock.json
�   package.json
�   readme.md
�   structure.txt
�   vite.config.js
�   webshop_guide.md
�   
+---public
�       favicon.ico
�       
+---src
    �   App.vue
    �   main.js
    �   
    +---assets
    �   +---scss
    �           main.scss
    �           
    +---components
    �   �   ConfirmationDialog.vue
    �   �   ImagePicker.vue
    �   �   LabelCreationModal.vue
    �   �   Notification.vue
    �   �   OrdersTable.vue
    �   �   ProductImportModal.vue
    �   �   StatsCard.vue
    �   �   TheWelcome.vue
    �   �   WelcomeItem.vue
    �   �   
    �   +---icons
    �           IconCommunity.vue
    �           IconDocumentation.vue
    �           IconEcosystem.vue
    �           IconSupport.vue
    �           IconTooling.vue
    �           
    +---composables
    �       useNotifier.js
    �       
    +---layouts
    �       MainLayout.vue
    �       
    +---router
    �       index.js
    �       
    +---utils
    �       apiClient.js
    �       eventBus.js
    �       
    +---views
        �   AboutView.vue
        �   CategoriesView.vue
        �   DashboardView.vue
        �   emailTemplates.vue
        �   HomeView.vue
        �   ImageManagerView.vue
        �   LoginView.vue
        �   OrdersView.vue
        �   ProductsView.vue
        �   SettingsView.vue
        �   StoriesView.vue
        �   UsersView.vue
        �   _old_OrdersView.vue
        �   _solid_DashboardView.vue
        �   

````
