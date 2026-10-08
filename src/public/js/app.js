// AcxiomCRM Client-Side Script
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Bootstrap Tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // 2. Client-side Form Validation
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });

  // 3. Password Strength / Policy Live Checker
  const passwordInput = document.getElementById('newPasswordInput');
  if (passwordInput) {
    const ruleLength = document.getElementById('ruleLength');
    const ruleUpper = document.getElementById('ruleUpper');
    const ruleLower = document.getElementById('ruleLower');
    const ruleNumber = document.getElementById('ruleNumber');
    const ruleSpecial = document.getElementById('ruleSpecial');

    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      updateRule(ruleLength, val.length >= 8);
      updateRule(ruleUpper, /[A-Z]/.test(val));
      updateRule(ruleLower, /[a-z]/.test(val));
      updateRule(ruleNumber, /[0-9]/.test(val));
      updateRule(ruleSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(val));
    });
  }

  function updateRule(element, isValid) {
    if (!element) return;
    if (isValid) {
      element.classList.remove('invalid');
      element.classList.add('valid');
      element.querySelector('i')?.classList.replace('bi-circle', 'bi-check-circle-fill');
    } else {
      element.classList.remove('valid');
      element.classList.add('invalid');
      element.querySelector('i')?.classList.replace('bi-check-circle-fill', 'bi-circle');
    }
  }

  // 4. Confirmation Dialog Modal Helper
  const confirmActionForms = document.querySelectorAll('.confirm-action');
  confirmActionForms.forEach(form => {
    form.addEventListener('submit', e => {
      const message = form.getAttribute('data-confirm-message') || 'Are you sure you want to proceed?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });
});
