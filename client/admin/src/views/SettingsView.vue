<!-- FILE: src/views/admin/SettingsView.vue -->
<template>
  <div>


    <div class="card">
      <div class="p-3">
        <!-- Tab Navigation -->
        <ul class="nav nav-tabs p-3-tabs">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'general' }" href="#" @click.prevent="activeTab = 'general'">General</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'layout' }" href="#" @click.prevent="activeTab = 'layout'">Layout</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'product' }" href="#" @click.prevent="activeTab = 'product'">Product</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'shipping' }" href="#" @click.prevent="activeTab = 'shipping'">Shipping</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'payments' }" href="#" @click.prevent="activeTab = 'payments'">Payments</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'orders' }" href="#" @click.prevent="activeTab = 'orders'">Orders</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'theme' }" href="#" @click.prevent="activeTab = 'theme'">Theme Colors</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'media' }" href="#" @click.prevent="activeTab = 'media'">Media & Social</a>
          </li>
          <li class="d-flex ms-auto">
            <button @click="saveAllSettings" class="btn btn-primary btn-sm"><i class="ph-duotone ph-floppy-disk me-2"></i>Save All Settings</button>
          </li>
        </ul>
        
      </div>
      <div class="card-body p-4">
        <form @submit.prevent="saveAllSettings">
          <!-- General Settings Tab -->
          <div v-show="activeTab === 'general'">
            <h5 class="card-title mb-3">General Information</h5>
            <div class="row g-3">
              <div class="col-md-4">
                <label for="shopTitle" class="form-label">Shop Title</label>
                <input type="text" v-model="settingsForm.shopTitle" id="shopTitle" class="form-control" />
              </div>
              <div class="col-md-4">
                <label for="shopSubtitle" class="form-label">Shop Subtitle</label>
                <input type="text" v-model="settingsForm.shopSubtitle" id="shopSubtitle" class="form-control" />
              </div>
              <div class="col-md-4">
                <label for="footerText" class="form-label">Footer Text</label>
                <input type="text" v-model="settingsForm.footerText" id="footerText" class="form-control" />
              </div>
  <!--            <div class="col-12">
                <label class="form-label">General Shop Remark</label>
                <div ref="quillEditorRef" style="height: 250px;"></div>
              </div>-->

            </div>
            <hr class="my-4">
            <h5 class="card-title mb-4">Shop Sender Address</h5>
            <div class="row g-3">
               <div class="col-md-3">
                  <label for="shopName" class="form-label">Sender Name</label>
                  <input type="text" v-model="settingsForm.shopAddress.name" id="shopName" class="form-control">
                </div>
                <div class="col-md-3">
                  <label for="shopStreet" class="form-label">Street & Number</label>
                  <input type="text" v-model="settingsForm.shopAddress.street" id="shopStreet" class="form-control">
                </div>
                <div class="col-md-3">
                  <label for="shopCity" class="form-label">City</label>
                  <input type="text" v-model="settingsForm.shopAddress.city" id="shopCity" class="form-control">
                </div>
                <div class="col-md-2">
                  <label for="shopZip" class="form-label">Postal Code</label>
                  <input type="text" v-model="settingsForm.shopAddress.zipCode" id="shopZip" class="form-control">
                </div>
                <div class="col-md-1">
                  <label for="shopCountry" class="form-label">Country Code</label>
                  <input type="text" v-model="settingsForm.shopAddress.countryCode" id="shopCountry" class="form-control" placeholder="e.g., NL">
                </div>
            </div>
          </div>
          <hr class="my-4">
          <h5 class="card-title mb-4">Business & Payment Information</h5>
          <div class="row g-3">
            <div class="col-md-4">
              <label for="cocNumber" class="form-label">Chamber of Commerce No.</label>
              <input type="text" v-model="settingsForm.businessDetails.chamberOfCommerceNumber" id="cocNumber" class="form-control">
            </div>
            <div class="col-md-4">
              <label for="vatNumber" class="form-label">VAT Number</label>
              <input type="text" v-model="settingsForm.businessDetails.vatNumber" id="vatNumber" class="form-control">
            </div>
          </div>
          <div class="row g-3 mt-2">
            <div class="col-md-4">
              <label for="bankAccountName" class="form-label">Bank Account Name</label>
              <input type="text" v-model="settingsForm.businessDetails.bankAccountName" id="bankAccountName" class="form-control">
            </div>
            <div class="col-md-4">
              <label for="bankAccountNumber" class="form-label">Bank Account Number (IBAN)</label>
              <input type="text" v-model="settingsForm.businessDetails.bankAccountNumber" id="bankAccountNumber" class="form-control">
            </div>
            <div class="col-md-4">
              <label for="bic" class="form-label">BIC / SWIFT</label>
              <input type="text" v-model="settingsForm.businessDetails.bic" id="bic" class="form-control">
            </div>
            <div class="col-md-4">
              <label for="paypalEmail" class="form-label">PayPal Email (for manual requests)</label>
              <input type="email" v-model="settingsForm.businessDetails.payPalEmail" id="paypalEmail" class="form-control">
            </div>
          </div>
          <!-- Layout Tab -->
          <div v-show="activeTab === 'layout'">
             <h5 class="card-title mb-3">Layout Settings</h5>
            <div class="row g-3">
              <div class="col-md-2">
                <label class="form-label">Page Layout</label>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pageLayout" id="layoutContained" value="contained" v-model="settingsForm.pageLayout">
                  <label class="form-check-label" for="layoutContained">Contained</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pageLayout" id="layoutFullWidth" value="full-width" v-model="settingsForm.pageLayout">
                  <label class="form-check-label" for="layoutFullWidth">Full Width</label>
                </div>
              </div>
              <div class="col-md-3">
                <label for="contentMaxWidth" class="form-label">Content Max Width (px)</label>
                <input type="number" v-model.number="settingsForm.contentMaxWidth" id="contentMaxWidth" class="form-control" :disabled="settingsForm.pageLayout === 'full-width'" />
                <div class="form-text">Applies only when "Contained" layout is selected.</div>
              </div>
              <div class="col-md-3">
                <label for="productsPerRow" class="form-label">Products per Row</label>
                <select v-model.number="settingsForm.productsPerRow" id="productsPerRow" class="form-select">
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>
              <div class="col-md-3">
                <label for="rowsPerPage" class="form-label">Rows per Page</label>
                <input type="number" v-model.number="settingsForm.rowsPerPage" id="rowsPerPage" class="form-control" />
                <div class="form-text">Set to 0 for no limit (disables pagination).</div>
              </div>
            </div>
            <hr class="my-4">
            <h5 class="card-title mb-3">Product Display Options</h5>
            <div class="row g-3">
              <div class="col-md-4" v-for="option in displayOptions" :key="option.key">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" :id="option.key" v-model="settingsForm[option.key]">
                  <label class="form-check-label" :for="option.key">{{ option.label }}</label>
                </div>
              </div>
            </div>
          </div>
           <!-- Product Tab -->
          <div v-show="activeTab === 'product'">
            <div class="row g-3">
              <div class="col-md-4">
                <h5 class="card-title mb-3">Product Features</h5>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="enableStockLimit" v-model="settingsForm.enableStockLimit">
                  <label class="form-check-label" for="enableStockLimit">Enable purchase limits per product</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="hideOutOfStock" v-model="settingsForm.hideOutOfStockProducts">
                  <label class="form-check-label" for="hideOutOfStock">Hide out-of-stock products from the shop</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="hideExpired" v-model="settingsForm.hideExpiredProducts">
                  <label class="form-check-label" for="hideExpired">Hide expired products from the shop</label>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card-title h5">SKU Generation</div>
                <div class="card-body" v-if="settingsForm.productSettings">
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="skuManual" value="manual" v-model="settingsForm.productSettings.skuGeneration">
                      <label class="form-check-label" for="skuManual">Manual (Enter SKU for each new product)</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="skuAuto" value="automatic" v-model="settingsForm.productSettings.skuGeneration">
                      <label class="form-check-label" for="skuAuto">Automatic (Generate sequential SKUs)</label>
                    </div>
                  </div>
                  <div v-if="settingsForm.productSettings.skuGeneration === 'automatic'">
                    <div class="row">
                      <div class="col-md-6">
                        <label for="skuPrefix" class="form-label">SKU Prefix</label>
                        <input type="text" id="skuPrefix" v-model="settingsForm.productSettings.skuPrefix" class="form-control" placeholder="e.g., ITEM-">
                      </div>
                      <div class="col-md-6">
                        <label for="skuNextNumber" class="form-label">Next SKU Number</label>
                        <input type="number" id="skuNextNumber" v-model.number="settingsForm.productSettings.skuNextNumber" class="form-control">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Shipping Tab Pane -->
          <div v-show="activeTab === 'shipping'">
            <!-- Nested Tab Navigation -->
            <ul class="nav nav-tabs mb-4">
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeShippingTab === 'packages' }" href="#" @click.prevent="activeShippingTab = 'packages'">Package Sizes</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeShippingTab === 'providers' }" href="#" @click.prevent="activeShippingTab = 'providers'">Providers</a>
              </li>
            </ul>

            <!-- Packages Tab Content -->
           <div v-show="activeShippingTab === 'packages'">
              <h5 class="card-title mb-3">Defined Package Sizes</h5>
              <p class="card-subtitle mb-3">These are the package sizes used for calculating shipping rates. Dimensions are in cm, weight in grams.</p>
              
              <table class="table align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Length (cm)</th>
                    <th>Width (cm)</th>
                    <th>Height (cm)</th>
                    <th>Max Weight (g)</th>
                    <th style="width:120px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(pkg, index) in settingsForm.shippingPackages" :key="index">
                    <td>{{ pkg.name }}</td>
                    <td>{{ pkg.length }}</td>
                    <td>{{ pkg.width }}</td>
                    <td>{{ pkg.height }}</td>
                    <td>{{ pkg.maxWeight }}</td>
                    <td>
                      <button class="btn btn-outline-secondary border-0 me-2" @click="openEditPackageModal(pkg, index)">
                        <i class="ph-duotone ph-pencil"></i>
                      </button>
                      <button class="btn  btn-outline-danger border-0" @click="removePackage(index)">
                        <i class="ph-duotone ph-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button @click.prevent="addPackage" class="btn btn-sm btn-secondary mb-4">
                <i class="ph-duotone ph-plus me-2"></i>
                Add Package
              </button>
              <div class="my-1 alert alert-warning fw-5">NOTE : The max-weight registered per package MUST be reduced with the weight of the package.</div>
              <!-- Edit Package Modal -->
              <div class="modal fade" ref="editPackageModalRef" tabindex="-1" aria-labelledby="editPackageModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                  <div class="modal-content" v-if="editPackageData">
                    <div class="modal-header">
                      <h5 class="modal-title" id="editPackageModalLabel">Edit Package</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                      <div class="mb-3">
                        <label class="form-label">Name</label>
                        <input type="text" v-model="editPackageData.name" class="form-control">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Length (cm)</label>
                        <input type="number" v-model.number="editPackageData.length" class="form-control">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Width (cm)</label>
                        <input type="number" v-model.number="editPackageData.width" class="form-control">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Height (cm)</label>
                        <input type="number" v-model.number="editPackageData.height" class="form-control">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Max Weight (g)</label>
                        <input type="number" v-model.number="editPackageData.maxWeight" class="form-control">
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                      <button type="button" class="btn btn-primary" @click="saveEditedPackage">Save</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Providers Tab Content -->
            <div v-show="activeShippingTab === 'providers'">
              <h5 class="card-title mb-4">Configured Shipping Providers</h5>
              <div v-if="loading.shipping" class="text-center">
                 <div class="spinner-border" role="status"></div>
              </div>
              <div v-else>
                <!-- Provider Loop -->
                <div v-for="provider in shippingProviders" :key="provider._id" class="mb-4 p-3 border rounded">
                  <div class="row g-3">
                    <!-- Provider Details -->
                    <div class="col-md-3">
                      <label class="form-label">Provider Name</label>
                      <input type="text" v-model="provider.name" class="form-control" disabled>
                    </div>
                    <div class="col-md-5">
                      <label class="form-label">API URL</label>
                      <input type="text" v-model="provider.apiUrl" class="form-control">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">API Key</label>
                      <input type="password" v-model="provider.credentials.apiKey" class="form-control" placeholder="Enter new key to update">
                    </div>

                    <!-- START: Rate Card JSON Editor -->
                    <div class="col-12">
                      <label class="form-label">Rate Card (JSON)</label>
                      <textarea v-model="provider.rateCardString" rows="8" class="form-control font-monospace"></textarea>
                      <div class="form-text">
                        Edit the provider's pricing structure. Must be valid JSON.
                      </div>
                    </div>
                    <!-- END: Rate Card JSON Editor -->

                    <div class="col-12 d-flex justify-content-between align-items-center">
                       <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" v-model="provider.isEnabled" :id="`enabled-${provider._id}`">
                          <label class="form-check-label" :for="`enabled-${provider._id}`">Enabled</label>
                        </div>
                      <button @click.prevent="saveShippingProvider(provider)" class="btn btn-secondary btn-sm">Save {{ provider.name }}</button>
                    </div>
                  </div>
                </div>
              </div>
              <hr class="my-4">
              <h5 class="card-title mb-3">Add New Provider</h5>
              <form @submit.prevent="addNewProvider" class="p-3 border rounded ">
                <div class="row g-3 align-items-end">
                  <div class="col-md-3">
                    <label class="form-label">Provider Name</label>
                    <input type="text" v-model="newProviderForm.name" class="form-control" required>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Provider Key</label>
                    <input type="text" v-model="newProviderForm.providerKey" class="form-control" required placeholder="e.g., dhl">
                    <div class="form-text">A unique key that matches the provider's filename.</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">API URL</label>
                    <input type="text" v-model="newProviderForm.apiUrl" class="form-control">
                  </div>
                  <div class="col-md-2">
                    <button type="submit" class="btn btn-success w-100">Add Provider</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
           <!-- Payments Tab -->
          <div v-show="activeTab === 'payments'">
            <div v-if="loading.payments" class="text-center">
              <div class="spinner-border" role="status"></div>
            </div>
            <div v-else>
              <div v-for="provider in paymentProviders" :key="provider._id" class="d-flex align-items-center p-3 border rounded mb-3">
                <div class="me-auto">
                  <h5 class="mb-0">{{ provider.name }}</h5>
                  <span v-if="provider.isOnline" class="badge" :class="provider.mode === 'live' ? 'bg-success' : 'bg-warning'">{{ provider.mode }}</span>
                  <span v-else class="badge bg-secondary">Offline</span>
                  <small class="text-muted ms-2">{{ provider.requiresRegistration ? 'Requires Login' : 'Available to All' }}</small>
                </div>
                <div class="form-check form-switch me-3">
                  <input class="form-check-input" type="checkbox" role="switch" :id="'payment-enable-' + provider._id" v-model="provider.isEnabled" @change="saveIndividualPaymentProvider(provider)">
                  <label class="form-check-label" :for="'payment-enable-' + provider._id">Enabled</label>
                </div>
                <button @click="openEditPaymentModal(provider)" class="btn btn-sm btn-outline-secondary">
                  <i class="ph ph-pencil-simple me-2"></i>Edit
                </button>
              </div>
            </div>
          </div>
        
          <!-- Orders Tab -->
          <div v-show="activeTab === 'orders'">
            <h5 class="card-title mb-3">Order Archiving</h5>
            <div class="row g-3">
              <div class="col-md-6">
                <label for="archiveOrdersDays" class="form-label">Days Before Archiving</label>
                <input type="number" v-model.number="settingsForm.archiveOrdersDays" id="archiveOrdersDays" class="form-control" />
                <div class="form-text">Orders will be archived this many days after their last update.</div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Statuses to Archive</label>
                <div v-for="status in availableOrderStatuses" :key="status" class="form-check">
                  <input class="form-check-input" type="checkbox" :value="status" :id="`status-${status}`" v-model="settingsForm.archiveOrdersStatuses">
                  <label class="form-check-label" :for="`status-${status}`">{{ status }}</label>
                </div>
              </div>
            </div>
          </div>
          <!-- Theme Colors Tab -->
          <div v-show="activeTab === 'theme'">
            <h5 class="card-title mb-3">Theme Colors</h5>
            <div class="row g-3">
              <div class="col-md-2">
                <label for="primaryColor" class="form-label">Primary Color</label>
                <input type="color" v-model="settingsForm.primaryColor" id="primaryColor" class="form-control form-control-color">
              </div>
              <div class="col-md-2">
                <label for="secondaryyColor" class="form-label">Secondary Color</label>
                <input type="color" v-model="settingsForm.secondaryColor" id="secondaryColor" class="form-control form-control-color">
              </div>
              <div class="col-md-2">
                <label for="siteBackgroundColor" class="form-label">Site Background</label>
                <input type="color" v-model="settingsForm.siteBackgroundColor" id="siteBackgroundColor" class="form-control form-control-color">
              </div>
              <div class="col-md-2">
                <label for="siteTextColor" class="form-label">Text Color</label>
                <input type="color" v-model="settingsForm.siteTextColor" id="siteTextColor" class="form-control form-control-color">
              </div>
              <div class="col-md-2">
                <label for="cardBackgroundColor" class="form-label">Card Background</label>
                <input type="color" v-model="settingsForm.cardBackgroundColor" id="cardBackgroundColor" class="form-control form-control-color">
              </div>
              <div class="col-md-2">
                <label for="productBackgroundColor" class="form-label">Product Detail Background</label>
                <input type="color" v-model="settingsForm.productBackgroundColor" id="productBackgroundColor" class="form-control form-control-color">
              </div>
            </div>
          </div>

          <!-- Media & Social Tab -->
          <div v-show="activeTab === 'media'">
            <h5 class="card-title mb-3">Header & Favicon</h5>
            <div class="row g-3 align-items-end">
              
              <div class="col-md-6">
                <label class="form-label">Header Banner Image</label>
                <div class="d-flex align-items-center">
                  <button type="button" class="btn btn-outline-secondary" @click="requestHeaderImage">Select Image</button>
                  <div v-if="settingsForm.headerImageUrl" class="ms-3 position-relative">
                    <img :src="getImageUrl(settingsForm.headerImageUrl)" class="rounded border" style="height: 40px; width: 120px; object-fit: cover;" />
                    <button @click="settingsForm.headerImageUrl = ''" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" style="line-height: 0.5;">&times;</button>
                  </div>
                  <span v-else class="text-muted ms-3">No image selected.</span>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label">Favicon</label>
                <div class="d-flex align-items-center">
                  <button type="button" class="btn btn-outline-secondary" @click="requestFaviconImage">Select Image</button>
                  <div v-if="settingsForm.faviconUrl" class="ms-3 position-relative">
                    <img :src="getImageUrl(settingsForm.faviconUrl)" class="rounded border" style="height: 40px; width: 40px; object-fit: cover;" />
                    <button @click="settingsForm.faviconUrl = ''" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" style="line-height: 0.5;">&times;</button>
                  </div>
                  <span v-else class="text-muted ms-3">No image selected.</span>
                </div>
              </div>

            </div>
            <hr class="my-4">
            <h5 class="card-title mb-3">Social Media Links</h5>
            <div class="row g-3">
              <div class="col-md-4">
                <label for="instagramUrl" class="form-label">Instagram URL</label>
                <input type="url" v-model="settingsForm.instagramUrl" id="instagramUrl" class="form-control" />
              </div>
              <div class="col-md-4">
                <label for="facebookUrl" class="form-label">Facebook URL</label>
                <input type="url" v-model="settingsForm.facebookUrl" id="facebookUrl" class="form-control" />
              </div>
              <div class="col-md-4">
                <label for="twitterUrl" class="form-label">Twitter URL</label>
                <input type="url" v-model="settingsForm.twitterUrl" id="twitterUrl" class="form-control" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="modal fade" ref="editPaymentProviderRef" tabindex="-1" aria-labelledby="editPaymentModalLabel" aria-hidden="true">
      <div class="modal-dialog" v-if="editPaymentProviderData">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editPaymentModalLabel">Edit {{ editPaymentProviderData.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" role="switch" :id="'requiresReg-' + editPaymentProviderData._id" v-model="editPaymentProviderData.requiresRegistration">
              <label class="form-check-label" :for="'requiresReg-' + editPaymentProviderData._id">Requires User Registration</label>
            </div>
            <hr>

            <div v-if="editPaymentProviderData.isOnline">
              <div class="mb-3">
                <label :for="'mode-' + editPaymentProviderData._id" class="form-label">Mode</label>
                <select class="form-select" :id="'mode-' + editPaymentProviderData._id" v-model="editPaymentProviderData.mode">
                  <option value="sandbox">Sandbox</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div class="mb-3">
                <label :for="'clientId-' + editPaymentProviderData._id" class="form-label">Client ID</label>
                <input type="text" class="form-control" :id="'clientId-' + editPaymentProviderData._id" v-model="editPaymentProviderData.credentials.clientId">
              </div>
              <div class="mb-3">
                <label :for="'clientSecret-' + editPaymentProviderData._id" class="form-label">Client Secret</label>
                <input type="password" class="form-control" :id="'clientSecret-' + editPaymentProviderData._id" v-model="editPaymentProviderData.credentials.clientSecret" placeholder="••••••••••••••">
                <small class="form-text">Leave blank to keep existing secret.</small>
              </div>
            </div>
            <div v-else>
              <div class="mb-3">
                <label :for="'instructions-' + editPaymentProviderData._id" class="form-label">Payment Instructions</label>
                <textarea class="form-control" :id="'instructions-' + editPaymentProviderData._id" rows="4" v-model="editPaymentProviderData.instructions" placeholder="Enter bank account details..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveEditedPaymentProvider">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, nextTick, watch } from 'vue';
import ImagePicker from '@/components/ImagePicker.vue';
import { Modal } from 'bootstrap'; 
import apiClient from '@/utils/apiClient';
import { useNotifier } from '@/composables/useNotifier';
import eventBus from '@/utils/eventBus';

const { addNotification } = useNotifier();
const activeTab = ref('general');
const activeShippingTab = ref('packages');
const quillEditorRef = ref(null);
let quillInstance = null;

const loading = reactive({ settings: true, shipping: true, payments: true });
const shippingProviders = ref([]);
const paymentProviders = ref([]); 
const availableOrderStatuses = ref(['created', 'received', 'processing', 'ready for shipment', 'pending payment', 'shipped', 'cancelled']);

const editPaymentProviderRef = ref(null);
const editPaymentProviderData = ref(null);
let editPaymentProviderModalInstance = null;

const displayOptions = ref([
  { key: 'showProductDescription', label: 'Show Description' },
  { key: 'showProductPrice', label: 'Show Price' },
  { key: 'showProductImage', label: 'Show Image' },
  { key: 'showProductAddToCart', label: 'Show "Add to Cart"' },
  { key: 'showProductCategory', label: 'Show Category' },
  { key: 'showProductTags', label: 'Show Tags' },
  { key: 'showProductRating', label: 'Show Rating' },
  { key: 'showProductStock', label: 'Show Stock' },
  { key: 'showProductDimensions', label: 'Show Product Dimensions' }, 
  { key: 'showProductReviews', label: 'Show Reviews' },
  { key: 'showProductSearch', label: 'Show Search Bar' },
  { key: 'showProductFilter', label: 'Show Filters' },
  { key: 'showProductSort', label: 'Show Sorting Options' },
  { key: 'showProductPagination', label: 'Show Pagination' },
  { key: 'allowShopRegistration', label: 'Allow Shop Registration' }
]);

const settingsForm = reactive({
  _id: null,
  shopTitle: '',
  shopSubtitle: '',
  headerImageUrl: '',
  faviconUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  twitterUrl: '',
  shopRemark: '',
  footerText: '',
  productsPerRow: 4,
  rowsPerPage: 0,
  enableStockLimit: false,
  hideExpiredProducts: true,
  hideOutOfStockProducts: true,
  allowShopRegistration: true,
  pageLayout: 'contained',
  contentMaxWidth: 1300,
  siteBackgroundColor: '#f8f9fa',
  siteTextColor: '#212529',
  primaryColor: '#9D9DCC',
  cardBackgroundColor: '#ffffff',
  productBackgroundColor: '#ffffff',
  archiveOrdersDays: 30,
  archiveOrdersStatuses: ['shipped', 'cancelled'],
  shopAddress: { name: '', street: '', city: '', zipCode: '', countryCode: '' },
    businessDetails: {
    bankAccountName: '',
    bankAccountNumber: '',
    bic: '',
    chamberOfCommerceNumber: '',
    vatNumber: '',
    payPalEmail: ''
  },
  shippingPackages: [],
    productSettings: {
    skuGeneration: 'manual',
    skuPrefix: 'ITEM-',
    skuNextNumber: 10001,
  },
  ...Object.fromEntries(displayOptions.value.map(opt => [opt.key, true]))
});

const newProviderForm = reactive({
  name: '',
  providerKey: '',
  apiUrl: '',
  isEnabled: true,
  credentials: { apiKey: '' }
});

const removePackage = (index) => {
  settingsForm.shippingPackages.splice(index, 1);
};

const initializeQuill = () => {
  if (quillEditorRef.value && !quillInstance) {
    quillInstance = new Quill(quillEditorRef.value, {
      theme: 'snow',
      modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean']] }
    });
    quillInstance.root.innerHTML = settingsForm.shopRemark;
  }
};

watch(activeTab, (newTab) => {
  if (newTab === 'general') {
    nextTick(() => initializeQuill());
  }
});

const getImageUrl = (filePath) => {
  if (!filePath) return '';
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${filePath}`;
};

const fetchSettings = async () => {
  loading.settings = true;
  try {
    const data = await apiClient('/settings');
    if (data) {

      Object.assign(settingsForm, data);
      // This ensures that if productSettings doesn't exist in the fetched data,
      // it gets initialized with default values, preventing errors.
      if (!settingsForm.productSettings) {
        settingsForm.productSettings = {
          skuGeneration: 'manual',
          skuPrefix: 'ITEM-',
          skuNextNumber: 10001,
        };
      }

    }
    if (activeTab.value === 'general') {
        await nextTick();
        initializeQuill();
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
  } finally {
    loading.settings = false;
  }
};

const fetchShippingProviders = async () => {
  loading.shipping = true;
  try {
    const providersData = await apiClient('/shipping-providers');
    // Add the rateCardString property for the textarea binding
    shippingProviders.value = providersData.map(p => ({
      ...p,
      rateCardString: JSON.stringify(p.rateCard || {}, null, 2)
    }));
  } catch (error) {
    console.error('Failed to fetch shipping providers:', error);
  } finally {
    loading.shipping = false;
  }
};

const requestHeaderImage = () => {
  eventBus.emit('open-image-picker', (imagePath) => {
    settingsForm.headerImageUrl = imagePath;
  });
};
const requestFaviconImage = () => {
  eventBus.emit('open-image-picker', (imagePath) => {
    settingsForm.faviconUrl = imagePath;
  });
};

const saveAllSettings = async () => {
  if (quillInstance) {
    settingsForm.shopRemark = quillInstance.root.innerHTML;
  }
  try {
    const response = await apiClient('/settings', {
      method: 'PUT',
      body: settingsForm
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

const saveShippingProvider = async (provider) => {
  const providerToSave = { ...provider };
  try {
    providerToSave.rateCard = JSON.parse(providerToSave.rateCardString);
  } catch (e) {
    addNotification('The rate card contains invalid JSON. Please correct it.', 'failure');
    return;
  }
  delete providerToSave.rateCardString;
  try {
    await apiClient(`/shipping-providers/${provider._id}`, {
      method: 'PUT',
      body: providerToSave
    });
     addNotification(`${provider.name} has been updated.`, 'success');
  } catch (error) {
    console.error('Failed to save shipping provider:', error);
  }
};

const addNewProvider = async () => {
  try {
    const newProvider = await apiClient('/shipping-providers', {
      method: 'POST',
      body: newProviderForm
    });
    shippingProviders.value.push({
      ...newProvider,
      rateCardString: JSON.stringify(newProvider.rateCard || {}, null, 2)
    });
    Object.assign(newProviderForm, {
      name: '',
      providerKey: '',
      apiUrl: '',
      isEnabled: true,
      credentials: { apiKey: '' }
    });
  } catch (error) {
    console.error('Failed to add new shipping provider:', error);
  }
};

const editPackageModalRef = ref(null);
const editPackageData = ref(null);
const editPackageIndex = ref(null);
let editPackageModalInstance = null;

const openEditPackageModal = (pkg, index) => {
  editPackageData.value = { ...pkg };
  editPackageIndex.value = index;
  if (!editPackageModalInstance) {
    editPackageModalInstance = new window.bootstrap.Modal(editPackageModalRef.value);
  }
  editPackageModalInstance.show();
};
const saveEditedPackage = () => {
  if (editPackageData.value) {
    if (editPackageIndex.value === null) {
      settingsForm.shippingPackages.push({ ...editPackageData.value });
    } else {
      settingsForm.shippingPackages[editPackageIndex.value] = { ...editPackageData.value };
    }
    editPackageModalInstance.hide();
  }
};
const addPackage = () => {
  editPackageData.value = {
    name: '',
    length: 10,
    width: 10,
    height: 10,
    maxWeight: 1000
  };
  editPackageIndex.value = null;
  if (!editPackageModalInstance) {
    editPackageModalInstance = new window.bootstrap.Modal(editPackageModalRef.value);
  }
  editPackageModalInstance.show();
};

const fetchPaymentProviders = async () => {
  loading.payments = true;
  try {
    const data = await apiClient('/payment-providers');
    paymentProviders.value = data.map(p => ({
      ...p,
      credentials: p.credentials || { clientId: '', clientSecret: '' }
    }));
  } catch (error) {
    console.error('Failed to fetch payment providers:', error);
  } finally {
    loading.payments = false;
  }
};
const saveIndividualPaymentProvider = async (provider) => {
  const payload = { isEnabled: provider.isEnabled };
  try {
    await apiClient(`/payment-providers/${provider._id}`, {
      method: 'PUT',
      body: payload
    });
    addNotification(`${provider.name} status updated.`, 'success');
  } catch(error) {
    console.error('Failed to update provider status:', error);
    // Revert the toggle on failure
    provider.isEnabled = !provider.isEnabled;
  }
};

const openEditPaymentModal = (provider) => {
  // 1. Set the data for the modal
  editPaymentProviderData.value = JSON.parse(JSON.stringify(provider));
  // 2. Show the modal (the instance is already created in onMounted)
  if (editPaymentProviderModalInstance) {
    editPaymentProviderModalInstance.show();
  }
};

const saveEditedPaymentProvider = async () => {
  if (!editPaymentProviderData.value) return;
  const provider = editPaymentProviderData.value;
  const payload = {
    isEnabled: provider.isEnabled,
    requiresRegistration: provider.requiresRegistration,
    mode: provider.mode,
    instructions: provider.instructions,
    credentials: provider.credentials,
  };
  if (provider.credentials.clientSecret === '') {
    delete payload.credentials.clientSecret;
  }
  try {
    const response = await apiClient(`/payment-providers/${provider._id}`, {
      method: 'PUT',
      body: payload
    });
    addNotification(response.msg || `${provider.name} has been updated.`, 'success');
    editPaymentProviderModalInstance.hide();
    await fetchPaymentProviders(); 
  } catch (error) {
    console.error('Failed to save payment provider:', error);
  }
};

onMounted(() => {
  fetchSettings();
  fetchShippingProviders();
  fetchPaymentProviders();
  if (editPaymentProviderRef.value) {
    editPaymentProviderModalInstance = new window.bootstrap.Modal(editPaymentProviderRef.value);
  }

});
</script>

