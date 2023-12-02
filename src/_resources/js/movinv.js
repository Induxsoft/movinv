var movinv = 
{
    tableId: '',
    table:null,
    init()
    {
        const formEntrada = document.querySelector('#formEntrada');
        const ikProducto = document.querySelector('#ikProducto');
        
        if (formEntrada) formEntrada.addEventListener('submit', e => this.guardarEntrada(e));
        if (this.tableId.trim() != '') 
        {
            this.table = document.querySelector('#'+this.tableId);
            if (ikProducto)
            {
                this.table.setInputKey("codigo",ikProducto);
                this.table.setInputKey("descripcion",ikProducto);
                ikProducto.addEventListener('change', data => {
                    this.agregarFilaProducto(data);
                });
            }
        }
    },
    agregarFila()
    {
        this.table.AddRow();
    },
    eliminarFila()
    {
        this.table.DeleteCurrentRow();
    },
    guardarEntrada(event)
    {
        event.preventDefault();
        if (!event.target.checkValidity()) return;

        let data = main.getValues('formEntrada')
        if (data == null) return;

        let products = this.table.DataArray.filter(d => Object.keys(d).length > 0);

        if (products.length <= 0) {
            alert('Por favor seleccione un producto.');
            return;
        }

        let productsDone = true;
        products.forEach((p,i) =>{
            if (productsDone && Number(p.cantidad) <= 0) {
                alert(`Debe establecer una cantidad mayor a 0 para el producto ${p.descripcion} `);
                this.table.NavTo(i,6);
                productsDone = false;
            }
        });

        if (!productsDone) return;

        data['_productos'] = products;

        InduxsoftCrudlModel.InvokeService('/movinv/', data, 
            success => { console.log(success); window.location.reload(); },
            failure => { console.log(failure); },
            "POST", false
        );
    },
    agregarFilaProducto(data)
    {
        let row = this.table.CurrentRowIndex();
        if (!this.table.DataArray[row]) this.table.DataArray[row] = {};

        data.cantidad = 1;
        this.table.DataArray[row] = data;
        this.table.UpdateRow(row);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    movinv.init();
})