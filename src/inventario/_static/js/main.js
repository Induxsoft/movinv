var main = {
    init()
    {
        
    },
    getValues(containerId='')
    {
        values = {};
        const controls = document.querySelectorAll(`#${containerId} input, #${containerId} select, #${containerId} textarea`);
        
        controls.forEach(control => 
        {
            if (values != null)
            {
                let v = '';

                if (control.id != 'inputv') v = control.value;
                else v = control.getAttribute('value');

                if (v.trim() == '' && control.getAttribute('required')=='true') {
                    alert('El campo: ' + control.name + ' es requerido');
                    control.focus();
                    values = null;
                }

                if ((control.getAttribute('type')??'').toLowerCase() == 'number' || ((control.getAttribute('hidden-type')??'') == 'number')) 
                    v = Number(v);

                    if (v.toString().trim() != '' && (control.name && control.name.toLowerCase() != 'null')) values[control.name] = v;

            }
        });

        return values;
    },
    setValues(containerId='', obj)
    {
        const controls = document.querySelectorAll(`#${containerId} input, #${containerId} select, #${containerId} textarea`);
        controls.forEach(control => {
            control.value = (obj[control.name]??'');
        });
    },
    clearValues(containerId)
    {
        const controls = document.querySelectorAll(`#${containerId} input, #${containerId} select, #${containerId} textarea, #${containerId} input-key`);
        
        try
        {
            controls.forEach(control => {
                if (control.tagName.toLowerCase() != 'input-key')
                    control.value = '';
                else control.clear();
            });
            return true;
        }
        catch(error)
        {
            alert(error);
            return false;
        }
    },
    closeModal(modalId='')
    {
        const modal = document.getElementById(modalId);
        if (modal)
        {
            modal.style.display = 'none';
            modal.classList.remove('show');
            return true;
        }
        return false;
    }
}
window.addEventListener('DOMContentLoaded', () => {
    main.init();
});