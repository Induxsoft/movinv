document.addEventListener("DOMContentLoaded",()=>{conteo.init();});

var conteo=
{
    init()
    {
        this.ip_uf_almacen=document.getElementById("ip_uf_almacen");
        this.tbl_almacenes=document.getElementById("tbl_almacenes");
        this.nombre=document.getElementById("nombre");
        this.aleatorio=document.getElementById("aleatorio");
        this.articulos=document.getElementById("articulos");

        if(this.ip_uf_almacen)this.ip_uf_almacen.addEventListener("change",(data)=>{conteo.AddDataTable(data);});
        if(this.aleatorio)this.aleatorio.addEventListener("change",()=>{conteo.enabledArticulos();})
    },
    enabledArticulos()
    {
        this.articulos.disabled=true;
        this.articulos.value="";
        if(this.aleatorio.checked)this.articulos.disabled=false;
    },
    filterData() 
    {
        return (this.tbl_almacenes?.DataArray??[]).filter((row) => { return Object.keys(row??{}).length >= this.tbl_almacenes.Columns.length });
    },
    CerrarConteo(sys_pk)
    {
        let res=confirm("¿Seguro desea cerra el conteo físico (no podrá continuar capturando la existencia física)?");
        if(!res)return;

        InduxsoftCrudlModel.InvokeService(`./${sys_pk}/cerrar-conteo/`, null,
			function (data) {
				window.location.reload();
			},
			function (error) 
            {
				if (error.message) alert(error.message);
				else console.error(error);
			}, "PATCH", false, false
		);
    },
    SincronizarConteo(sys_pk)
    {
        let res=confirm("¿Esta seguro que desea sincronizar?");
        if(!res)return;

        InduxsoftCrudlModel.InvokeService(`./${sys_pk}/sinc-conteo/`, null,
			function (data) {
				window.location.reload();
			},
			function (error) 
            {
				if (error.message) alert(error.message);
				else console.error(error);
			}, "PATCH", false, false
		);
    },
    AddDataTable(data)
    {
        if(!data || Object.keys(data).length<1)return;
        if(!this.tbl_almacenes)return;

        let dtarray = this.tbl_almacenes?.DataArray ?? [];
        let _data = this.filterData();
        let available_row = (_data.length > 0) ? _data.length : 0;

        dtarray[available_row] = data;

        this.tbl_almacenes._printRows();
        this.tbl_almacenes.NavTo(available_row,2);

        this.ip_uf_almacen.setValue({});
    },
    AddRow()
    {
        this.tbl_almacenes.AddRow();
    },
    DeleteRow()
    {
        this.tbl_almacenes.DeleteCurrentRow();
    },
    Submit()
    {   
        let dtarray = this.tbl_almacenes?.DataArray ?? [];
        var narray=[];
        for (let i = 0; i < dtarray.length; i++) 
        {
            const row = dtarray[i];
            if(row && Object.keys(row).length>0 )narray.push(row);
        }
        if(this.nombre.value.trim()=="")
        {
            alert("Debe colocar un nombre");
            this.nombre.focus();
            return;
        }
        if(narray.length<1)
        {
            alert("Debe colocar por lo menos un almacén");
            return;
        }
        var details=
        {
            uf_almacen:narray
        }
        InduxsoftCrudlModel.Submit("form_conteo_fisico",details);
    }

}