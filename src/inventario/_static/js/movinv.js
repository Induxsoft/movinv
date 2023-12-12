var movinv = 
{
    tableId: '',
    table:null,
    init()
    {
        const formEntrada = document.querySelector('#formEntrada');
        const ikProducto = document.querySelector('#ikProducto');
        const input_search_prod = document.querySelector('#input_search_prod');
        const btn_search_prod = document.querySelector('#btn_search_prod');
        
        if (formEntrada) formEntrada.addEventListener('submit', e => this.guardarEntrada(e));
        if (input_search_prod) input_search_prod.addEventListener('keydown', e => {
            if (e.key === 'Enter')
                this.buscarProducto();
        });
        if (btn_search_prod) btn_search_prod.addEventListener('click', e => { this.buscarProducto(); });
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
        let url = movinv.url_inventario + "_new/";

        InduxsoftCrudlModel.InvokeService(url, data, 
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
    },
    buscarProducto()
    {
        let input_search = document.querySelector('#input_search_prod');
        let search = input_search.value;
        if (!search.trim()) return;

        let url = input_search.getAttribute('url');
        url = url.replace('@search', search);

        InduxsoftCrudlModel.InvokeService(url, null, 
            success => { this.pintarProductos(success) },
            failure => { alert('No se pudo realizar la busqueda.\n'+JSON.stringify(failure)); },
            "GET", false
        );
    },
    pintarProductos(data)
    {
        let tbl_productos = document.querySelector('#tbl_productos');
        tbl_productos.DataArray = data;
        tbl_productos._printRows();
    },
    goTo(url)
    {
        if (!url) { alert("No se ha indicado un destino."); return; }
        if (this.table.CurrentRowIndex() < 0) { alert("Debe seleccionar una fila"); return; }

        var data = this.table.DataArray[this.table.CurrentRowIndex()];
        if (!data.sys_pk) return;

        var url = url.replace("@_doc",data.sys_pk);
        window.location.href = url;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    movinv.init();
})