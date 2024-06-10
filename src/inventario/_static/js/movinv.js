var movinv = 
{
    tableId: "", table:null, tEvents:{}, tData:[], tColdef:null,
    movimiento:"", url_buscar_producto:"", url_lotes_series_producto:"",

    init()
    {
        const formEntrada = document.querySelector('#formEntrada');
        const ik_entrada_almacen = document.getElementById("ik_entrada_almacen");
        const ik_salida_almacen = document.getElementById("ik_salida_almacen");
        const ik_almacen_origen = document.getElementById("ik_almacen_origen");
        const ik_almacen_destino = document.getElementById("ik_almacen_destino");
        const ik_producto = document.querySelector('#ikProducto');
        const ik_lot_prod = document.getElementById("ik_lot_prod");
        const ik_ser_prod = document.getElementById("ik_ser_prod");
        const btn_add_lote = document.getElementById("btn_add_lote");
        const btn_add_serie = document.getElementById("btn_add_serie");
        
        if (formEntrada) formEntrada.addEventListener('submit', e => this.guardarEntrada(e));
        
        if (this.tableId.trim() != '') 
        {
            this.table = document.querySelector('#'+this.tableId);
            
            if (ik_producto)
            {
                this.url_buscar_producto = ik_producto.getAttribute("data-source");

                this.table.setInputKey("codigo",ik_producto);
                this.table.setInputKey("descripcion",ik_producto);

                ik_producto.onBeforeSearch = (url) => {
                    let almacen1 = {};
                    let almacen2 = {};

                    if (this.movimiento === "entrada") almacen1 = ik_entrada_almacen.getValue() ?? {};
                    if (this.movimiento === "salida") almacen1 = ik_salida_almacen.getValue() ?? {};
                    if (this.movimiento === "traspaso")
                    {
                        url = InduxsoftCrudlModel.UrlAddParameter(url,"_mov","traspaso");

                        almacen1 = ik_almacen_origen.getValue() ?? {};
                        almacen2 = ik_almacen_destino.getValue() ?? {};
                    }

                    url = InduxsoftCrudlModel.UrlAddParameter(url,"ialmacen1",Number(almacen1?.sys_pk ?? 0));
                    url = InduxsoftCrudlModel.UrlAddParameter(url,"ialmacen2",Number(almacen2?.sys_pk ?? 0));

                    return url;
                }
                ik_producto.addEventListener('change', data => {
                    this.agregarFilaProducto(data);
                });
            }

            if (ik_lot_prod)
            {
                // this.table.setInputKey("lote",ik_lot_prod);
                btn_add_lote.addEventListener("click", () => this.launchIkLoteSerie(ik_lot_prod));
                ik_lot_prod.change_event = (data) => this.addLoteToProduct(data);
            }

            if (ik_ser_prod)
            {
                // this.table.setInputKey("serie",ik_ser_prod);
                btn_add_serie.addEventListener("click", () => this.launchIkLoteSerie(ik_ser_prod));
                ik_ser_prod.change_event = (data) => this.addSerieToProduct(data);
            }
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

        this.setTableEvents();
        this.toggleColumns();
    },
    setTableEvents()
    {
        if (!this.table) return;
        if (this.tColdef === null) this.tColdef = JSON.parse(JSON.stringify(this.table.Columns));

        this.tEvents = this.table.EdiTable.Const.Events;
        this.tData = this.table.DataArray;

        this.table.Events[this.tEvents.EnterCell] = (e) => { this.tEnterCell(e); }
        // this.table.Events[this.tEvents.StartEdition] = (e) => { this.tStartEdition(e); }
        this.table.Events[this.tEvents.BeforeUpdateCell] = (e) => { this.tBeforeUpdateCell(e); }
        this.table.Events[this.tEvents.ConfirmEdition] = (e) => { this.tConfirmEdition(e); }
    },
    launchIkLoteSerie(ik)
    {
        let curr_row = this.table.CurrentRowIndex();
        let producto = (this.table?.DataArray??[])[curr_row] ?? {};
        let ik_almacen_id = "";
        let ialmacen = 0;

        if (this.url_lotes_series_producto.trim() === "") this.url_lotes_series_producto = ik.getAttribute("data-source");
        if (this.movimiento === "entrada") ik_almacen_id = "ik_entrada_almacen";
        if (this.movimiento === "salida") ik_almacen_id = "ik_salida_almacen";
        if (this.movimiento === "traspaso") ik_almacen_id = "ik_almacen_origen";

        if (curr_row < 0) return;
        if (Object.keys(producto) < 8) return;

        const ik_almacen = document.getElementById(ik_almacen_id);
        if (ik_almacen) ialmacen = Number((ik_almacen.getValue()??{})?.sys_pk??0);

        if (ialmacen <= 0) {
            alert("No se ha seleccionado un almacén, seleccione uno e intente nuevamente.");
            return;
        }
        if (ik.id === "ik_lot_prod" && !producto.reqlote) {
            alert("El producto seleccionado no requiere lote");
            return;
        }
        if (ik.id === "ik_ser_prod" && !producto.reqserie) {
            alert("El producto seleccionado no requiere serie");
            return;
        }

        let endpoint = this.url_lotes_series_producto;
        endpoint = endpoint.replace("@iproducto",producto.sys_pk);
        endpoint = endpoint.replace("@ialmacen",ialmacen);

        ik.setAttribute("data-source",endpoint);
        ik.searchText("%",false);
    },
    addLoteToProduct(data)
    {
        let curr_row = this.table.CurrentRowIndex();
        let producto = (this.table?.DataArray??[])[curr_row] ?? {};
        producto["lote"] = data?.numero ?? "";
        producto["fcad"] = data?.fcaducidad ?? "";
        this.table.UpdateRow(curr_row);
    },
    addSerieToProduct(data)
    {
        let curr_row = this.table.CurrentRowIndex();
        let producto = (this.table?.DataArray??[])[curr_row] ?? {};
        producto["serie"] = data?.numero ?? "";
        this.table.UpdateRow(curr_row);
    },
    toggleColumns()
    {
        if (!this.table) return;

        const btn_add_lote = document.getElementById("btn_add_lote");
        const btn_add_serie = document.getElementById("btn_add_serie");

        let col_lote = false;
        let col_fcad = false;
        let col_serie = false;

        const array = this.table?.DataArray ?? [];
        for (let i = 0; i < array.length; i++) {
            const obj = array[i];

            if (col_lote && col_serie) break;
            
            if (!col_lote && obj.reqlote) {
                col_lote = true;
                col_fcad = true;
            }
            if (!col_serie && obj.reqserie) {
                col_serie = true;
            }
        }

        this.table.hideColumn("lote",!col_lote);
        this.table.hideColumn("fcad",!col_fcad);
        this.table.hideColumn("serie",!col_serie);

        if (btn_add_lote) btn_add_lote.classList.toggle("d-none",!col_lote);
        if (btn_add_serie) btn_add_serie.classList.toggle("d-none",!col_serie);
    },
    tEnterCell(e)
    {
        let coldef = e.sender.GetColumnDefOfTd(e.td);
        let curr_row = this.table.RowIndexOfTd(e.td);
        let curr_col = this.table.ColIndexOfTd(e.td);
        let producto = this.table.DataArray[curr_row];

        this.table.Columns[curr_col].type = this.tColdef[curr_col].type;
        if (Object.keys(producto ?? {}).length < 8) return;

        this.disableCells(curr_col,coldef.field,producto);
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

        if (field === "cantidad")
        {
            let cantidad = Number(e.text.trim());

            if (item.reqserie && cantidad > 1) {
                alert("La cantidad para este producto con serie requerida debe ser 1, para agregar más series del mismo producto insertelo en una nueva fila");
                cantidad = 1;
            }

            e.text = cantidad;
            item["cantidad"] = cantidad;
            
            switch (this.movimiento) {
                case "entrada":
                    item["nueva_existencia"] = Math.add(item.existencia,cantidad);
                    break;
                case "salida":
                    item["nueva_existencia"] = Math.sub(item.existencia,cantidad);
                    break;
                case "traspaso":
                    item["nueva_existencia_origen"] = Math.sub(Number(item.exist_origen),cantidad);
                    item["nueva_existencia_destino"] = Math.add(Number(item.exist_destino),cantidad);
                    break;
            }

            this.table.UpdateRow(currRow);
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
        this.toggleColumns();
    },
    disableCells(icol,field,data)
    {
        // Deshabilitar edición a las celdas de lote, caducidad y serie si el producto no lo requiere.
        if (!["lote","fcad","serie"].includes(field)) return;

        if ((field === "lote" || field === "fcad") && !data.reqlote) this.table.Columns[icol].type = "NoEditable";
        else if (field === "serie" && !data.reqserie) this.table.Columns[icol].type = "NoEditable";
        else this.table.Columns[icol].type = this.tColdef[icol].type;
    },
    validateLoteSerie(detalle)
    {
        let Ok = true;

        for (let i = 0; i < detalle.length; i++) {
            const row = detalle[i];
            
            if (Boolean(row.reqlote) && (row.lote??"").trim() === "") {
                alert(`No es posible continuar, el producto ${row.codigo} - ${row.descripcion} requiere un número de lote.`);
                Ok = false;
                break;
            }

            if (Boolean(row.reqserie) && (row.serie??"").trim() === "") {
                alert(`No es posible continuar, el producto ${row.codigo} - ${row.descripcion} requiere un número de serie.`);
                Ok = false;
                break;
            }
        }

        return Ok;
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

        /* let productsDone = true;
        for (let i = 0; i < products.length; i++) {
            const prod = products[i];
            if (Number(prod.cantidad) <= 0) {
                alert(`Debe establecer una cantidad mayor a 0 para el producto ${p.descripcion} `);
                let index_cantidad = (this.tColdef??[]).findIndex(column => column.field === "cantidad") || 6;
                this.table.NavTo(i,index_cantidad);
                productsDone = false;
                break;
            }
        }
        if (!productsDone) return; */

        if (!this.validateLoteSerie(products)) return;

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
        this.toggleColumns();
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