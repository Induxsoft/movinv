var movinv = 
{
    tableId: "", table:null, tEvents:{}, tData:[],
    movimiento:"", url_buscar_producto:"",

    init()
    {
        const formEntrada = document.querySelector('#formEntrada');
        const ik_entrada_almacen = document.getElementById("ik_entrada_almacen");
        const ik_salida_almacen = document.getElementById("ik_salida_almacen");
        const ik_almacen_origen = document.getElementById("ik_almacen_origen");
        const ik_almacen_destino = document.getElementById("ik_almacen_destino");
        const ikProducto = document.querySelector('#ikProducto');
        const btn_search_prod = document.querySelector('#btn_search_prod');
        
        if (formEntrada) formEntrada.addEventListener('submit', e => this.guardarEntrada(e));
        if (btn_search_prod) btn_search_prod.addEventListener('click', e => { this.buscarProducto(); });
        if (this.tableId.trim() != '') 
        {
            this.table = document.querySelector('#'+this.tableId);
            if (ikProducto)
            {
                this.url_buscar_producto = ikProducto.getAttribute("data-source");

                this.table.setInputKey("codigo",ikProducto);
                this.table.setInputKey("descripcion",ikProducto);

                ikProducto.onBeforeSearch = (url) => {
                    let almacen = {};
                    let almacen2 = {};

                    if (this.movimiento === "entrada") almacen = ik_entrada_almacen.getValue() ?? {};
                    if (this.movimiento === "salida") almacen = ik_salida_almacen.getValue() ?? {};
                    if (this.movimiento === "traspaso")
                    {
                        url = InduxsoftCrudlModel.UrlAddParameter(url,"_mov","traspaso");

                        almacen = ik_almacen_origen.getValue() ?? {};
                        almacen2 = ik_almacen_destino.getValue() ?? {};
                    }

                    url = InduxsoftCrudlModel.UrlAddParameter(url,"fil_almacen",Number(almacen?.sys_pk ?? 0));
                    url = InduxsoftCrudlModel.UrlAddParameter(url,"ialmacen2",Number(almacen2?.sys_pk ?? 0));

                    return url;
                }
                ikProducto.addEventListener('change', data => {
                    this.agregarFilaProducto(data);
                });
            }

            if (ik_entrada_almacen) ik_entrada_almacen.change_event = (data) => this.actualizarExistenciaProductos(data);
            if (ik_salida_almacen) ik_salida_almacen.change_event = (data) => this.actualizarExistenciaProductos(data);
            if (ik_almacen_origen) ik_almacen_origen.change_event = (data) =>
            {
                let ialmacen1 = (ik_almacen_origen.getValue() ?? {})?.sys_pk ?? 0;
                let ialmacen2 = (ik_almacen_destino.getValue() ?? {})?.sys_pk ?? 0;

                if (ialmacen1 === ialmacen2) {
                    alert("El Almacen de origen no puede ser el mismo que el Almacen destino.");
                    ik_almacen_origen.clear();
                    return;
                }

                this.actualizarExistenciaProductos(data,"ik_almacen_origen");
            }
            if (ik_almacen_destino) ik_almacen_destino.change_event = (data) =>
            {
                let ialmacen1 = (ik_almacen_origen.getValue() ?? {})?.sys_pk ?? 0;
                let ialmacen2 = (ik_almacen_destino.getValue() ?? {})?.sys_pk ?? 0;

                if (ialmacen1 === ialmacen2) {
                    alert("El Almacen destino no puede ser el mismo que el Almacen de origen.");
                    ik_almacen_destino.clear();
                    return;
                }

                this.actualizarExistenciaProductos(data,"ik_almacen_destino");
            }
        }

        this.setTableEvents();
    },
    setTableEvents()
    {
        if (!this.table) return;

        this.tEvents = this.table.EdiTable.Const.Events;
        this.tData = this.table.DataArray;

        // this.table.Events[this.tEvents.StartEdition] = (e) => { this.tStartEdition(e); }
        this.table.Events[this.tEvents.BeforeUpdateCell] = (e) => { this.tBeforeUpdateCell(e); }
        this.table.Events[this.tEvents.ConfirmEdition] = (e) => { this.tConfirmEdition(e); }
    },
    tStartEdition(e) {
        let currRow = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let item = this.tData[currRow];

        if (Object.entries(item ?? {}).length === 0) return;
    },
    tBeforeUpdateCell(e) {
        let currRow = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let item = this.tData[currRow];

        if (Object.entries(item ?? {}).length === 0) return;

        if (field == "cantidad" && Number(e.text.trim()) <= 0) {
            alert("El valor debe ser mayor que 0.");
            e.cancel = true;
            return false;
        }
    },
    tConfirmEdition(e) {
        let currRow = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let item = this.tData[currRow];

        if (Object.entries(item ?? {}).length === 0) return;

        switch (this.tableId) {
            case "et_entrada_productos":
                if (field == "cantidad") {
                    item["nueva_existencia"] = Math.add(item.existencia,Number(e.text.trim()));
                    this.table.UpdateRow(currRow);
                }
                break;
            case "et_salida_productos":
                if (field == "cantidad") {
                    item["nueva_existencia"] = Math.sub(item.existencia,Number(e.text.trim()));
                    this.table.UpdateRow(currRow);
                }
                break;
            case "et_traspaso_productos":
                if (field === "cantidad")
                {
                    item["nueva_existencia_origen"] = Math.sub(Number(item.exist_origen),Number(e.text.trim()));
                    item["nueva_existencia_destino"] = Math.add(Number(item.exist_destino),Number(e.text.trim()));
                    this.table.UpdateRow(currRow);
                }
                break;
        }
    },
    filterDataArray(edt) {
        if (!edt) return [];
        return (edt?.DataArray??[]).filter((row) => { return Object.keys(row??{}).length >= edt.Columns.length })
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
            success => {
                if (success.message) { alert(success.message); return; }
                
                alert("Movimiento creado con éxito.");
                window.location.reload();
            },
            failure => { alert(failure.message??failure); },
            "POST", false
        );
    },
    agregarFilaProducto(data)
    {
        let row = this.table.CurrentRowIndex();
        if (!this.table.DataArray[row]) this.table.DataArray[row] = {};

        data.cantidad = 1;
        if (this.movimiento === "entrada") data.nueva_existencia = (data.existencia + 1);
        if (this.movimiento === "salida") data.nueva_existencia = (data.existencia - 1);
        if (this.movimiento === "traspaso")
        {
            data.exist_origen = Number(data.exist_origen ?? data.existencia);
            data.nueva_existencia_origen = Math.sub(data.exist_origen,data.cantidad);
            data.exist_destino = Number(data.exist_destino ?? data.existencia);
            data.nueva_existencia_destino = Math.add(data.exist_destino,data.cantidad);
        }

        this.table.DataArray[row] = data;
        this.table.UpdateRow(row);
    },
    actualizarExistenciaProductos(almacen,almacen_id="")
    {
        let ialmacen = Number(almacen?.sys_pk ?? 0);
        let products = this.table.DataArray.filter(d => Object.keys(d).length > 0); //this.filterDataArray(this.table);
        let iproducts = [];

        if (ialmacen <= 0 || products.length <= 0) return;

        for (let i = 0; i < products.length; i++) {
            const prod = products[i];
            
            if (iproducts.includes(prod.sys_pk)) continue;
            iproducts.push(prod.sys_pk);
        }

        let url = InduxsoftCrudlModel.UrlAddParameter(this.url_buscar_producto,"_act","existencias");
        url = InduxsoftCrudlModel.UrlAddParameter(url,"ialmacen",ialmacen)
        url = InduxsoftCrudlModel.UrlAddParameter(url,"iproducts",iproducts.join(","));

        fetch(url).then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                return;
            }

            let dtarray = this.table?.DataArray ?? [];
            for (let i = 0; i < dtarray.length; i++) {
                const producto = dtarray[i];
                if (Object.keys(producto??{}).length < this.table.Columns.length) continue;
    
                let existencia = (data.find((obj) => producto.sys_pk === obj.iproducto) ?? {}).existencia ?? 0;
                let cantidad = Number(producto.cantidad);

                if (almacen_id === "") producto.existencia = existencia;
                if (this.movimiento === "entrada") producto.nueva_existencia = Math.add(existencia,cantidad);
                if (this.movimiento === "salida") producto.nueva_existencia = Math.sub(existencia,cantidad);
                if (this.movimiento === "traspaso")
                {
                    if (almacen_id === "ik_almacen_origen") {
                        producto.exist_origen = existencia;
                        producto.nueva_existencia_origen = Math.sub(existencia,cantidad);
                    }
                    if (almacen_id === "ik_almacen_destino") {
                        producto.exist_destino = existencia;
                        producto.nueva_existencia_destino = Math.add(existencia,cantidad);
                    }
                }

                this.table.UpdateRow(i);
            }
        })
        .catch(error => console.error(error));
    },

    getCurrentContext()
    {
        const table = this.table;
        const id = (table?.DataArray[table.CurrentRowIndex()]?.sys_pk ?? "");
        return { item_id:id, context: {} }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    movinv.init();
})