document.addEventListener('DOMContentLoaded', function() {
  
    const pantherAvailability = localStorage.getItem('panther_availability');
    document.querySelectorAll('.service-item-row').forEach(function(row) {
      const location = row.getAttribute('data-location');
      console.log(location)
      if (pantherAvailability === 'Available' && (location === 'local' || location === 'Local')) {
        row.style.display = 'none';
      }
    });

const loaderOverlay = document.querySelector('.loader-overlay');

function showLoader() {
  loaderOverlay.style.display = 'flex';
}

function hideLoader() {
  loaderOverlay.style.display = 'none';
}

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function updateCart(key, quantity) {
    showLoader();
    fetch('/cart.js') // Fetch the current cart state
      .then(response => response.json())
      .then(cart => {
        const itemToChange = cart.items.find(item => item.key === key);
  
        if (quantity === 0 && itemToChange.properties.Variant) {
          // Removing a parent item
          const parentVariant = itemToChange.properties.Variant;
          const relatedServiceKeys = cart.items
            .filter(item => item.properties.Parent === parentVariant)
            .map(serviceItem => serviceItem.key);
          
          // Function to remove items one by one
          const removeItem = (itemKey) => {
            return fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: itemKey,
                quantity: 0
              })
            });
          };
  
          // Sequentially remove related services
          const removeRelatedServices = relatedServiceKeys.reduce((promise, serviceKey) => {
            return promise.then(() => removeItem(serviceKey));
          }, Promise.resolve());
  
          removeRelatedServices.then(() => {
            // Finally, remove the parent item
            removeItem(key).then(() => {
              location.reload(); // Reload the page to reflect the changes
            });
          });
        } else {
          // Changing quantity or removing a service item directly
          fetch('/cart/change.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              id: key,
              quantity: quantity
            })
          })
          .then(response => response.json())
          .then(() => {
            location.reload(); // Reload the page to reflect the changes
          });
        }
      })
      .catch(error => console.error('Error:', error));
  }
  
  
function addService(variantId, properties) {
  showLoader();
  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: variantId,
      quantity: 1,
      properties: properties
    })
  })
  .then(response => response.json())
  .then(cart => {
    
    location.reload(); // Reload the page to reflect the changes
  })
  .catch(error => console.error('Error:', error));
}

document.querySelectorAll('.quantity-decrease').forEach(function(button) {
  button.addEventListener('click', debounce(function() {
    const key = this.getAttribute('data-key');
    const input = this.closest('.quantity-selector').querySelector('.quantity-input');
    let quantity = parseInt(input.value, 10);
    
    if (quantity > 1) {
      quantity--;
      input.value = quantity;
      updateCart(key, quantity);
    }
  }, 300));
});

document.querySelectorAll('.quantity-increase').forEach(function(button) {
  button.addEventListener('click', debounce(function() {
    const key = this.getAttribute('data-key');
    const input = this.closest('.quantity-selector').querySelector('.quantity-input');
    let quantity = parseInt(input.value, 10);
    
    quantity++;
    input.value = quantity;
    updateCart(key, quantity);
  }, 300));
});

document.querySelectorAll('.remove-item').forEach(function(button) {
  button.addEventListener('click', debounce(function() {
    const key = this.getAttribute('data-key');
    
    updateCart(key, 0);
  }, 300));
});

document.querySelectorAll('.add-service').forEach(function(button) {
  button.addEventListener('click', debounce(function() {
    const serviceId = this.getAttribute('data-service-id');
    const parentId = this.getAttribute('data-parent-id');
    
    const properties = {
      Parent: parentId
    };
    
    addService(serviceId, properties);
  }, 300));
});

// Hide the loader by default on page load
hideLoader();
});