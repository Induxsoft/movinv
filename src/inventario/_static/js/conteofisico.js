document.addEventListener("DOMContentLoaded",()=>
{
    conteo.init();
    conteo.detail.init();
});

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

        let url="";
        if(conteo.detail.url_conteo)url=conteo.detail.url_conteo + `${sys_pk}/cerrar-conteo/`;
        else url=`./${sys_pk}/cerrar-conteo/`;
        
        tools.V12FormBarDisableControls(true);
        InduxsoftCrudlModel.InvokeService(url, null,
			function (data) {
				window.location.reload();
			},
			function (error) 
            {
                tools.V12FormBarDisableControls(false);
				if (error.message) alert(error.message);
				else console.error(error);
			}, "PATCH", false, false
		);
    },
    SincronizarConteo(sys_pk)
    {
        let res=confirm("¿Esta seguro que desea sincronizar?");
        if(!res)return;

        let url="";
        if(conteo.detail.url_conteo)url=conteo.detail.url_conteo + `${sys_pk}/sinc-conteo/`;
        else url=`./${sys_pk}/sinc-conteo/`;

        tools.V12FormBarDisableControls(true);

        InduxsoftCrudlModel.InvokeService(url, null,
			function (data) 
            {
				window.location.reload();
			},
			function (error) 
            {
                tools.V12FormBarDisableControls(false);
				if (error.message) alert(error.message);
				else console.error(error);
			}, "PATCH", false, false
		);
    },
    Export(sys_pk,cat=0)
    {
        let type="text";
        if(cat==1)type="html";
        else if(cat==2){type="csv"}

        var data=
        {
            type:type,
            totales:
            {
                vfisico:conteo.detail.summary_vfisico?.textContent ?? 0,
                vteorico:conteo.detail.summary_vteorico?.textContent ?? 0,
                vdiferencia:conteo.detail.summary_vdiferencia?.textContent ?? 0
            },
            data:conteo.detail.tbl_detail_conteo_fisico.DataArray
        }

        InduxsoftCrudlModel.InvokeService(conteo.detail.url_conteo + `${sys_pk}/export/`, data,
			function (data) 
            {
				if(data && data.url)window.open(data.url,"_blank");
                else alert("No se logró, exportar intente de nuevo");
			},
			function (error) 
            {
                tools.V12FormBarDisableControls(false);
				if (error.message) alert(error.message);
				else console.error(error);
			}, "PATCH", false, false
		);
    },
    Import(sys_pk=0)
    {
        console.log(sys_pk)
        if(!conteo.detail.file_import || conteo.detail.file_import.value.trim()=="")return;

        var data=new FormData()
        data.append("type","import");
        console.log(data)
        if(conteo.detail.file_import.files.length<1)
        {
            alert("Debe seleccionar un archivo");
            return;
        }
        for (let i = 0; i < conteo.detail.file_import.files.length; i++) 
        {
            const file = conteo.detail.file_import.files[i];
            data.append(file.name,file);
        }

        InduxsoftCrudlModel.InvokeService(conteo.detail.url_conteo + `${sys_pk}/import/`, data,
			function (data) 
            {
                if(conteo.detail.file_import)conteo.detail.file_import.value="";
                if(data && data.url)window.open(data.url,"_blank");
                
                setTimeout(() => 
                {
                    window.location.reload();
                }, 500);
			},
			function (error) 
            {
                if(conteo.detail.file_import)conteo.detail.file_import.value="";

                tools.V12FormBarDisableControls(false);
				if (error.message) alert(error.message);
				else console.error(error);
			}, "PATCH", false, false,"",true
		);
    },
    AddDataTable(data)
    {
        if(!data || Object.keys(data).length<1)return;
        if(!this.tbl_almacenes)return;

        let dtarray = this.tbl_almacenes?.DataArray ?? [];
        let row=dtarray.find((r)=>r.sys_pk==data.sys_pk);
        if(row)
        {
            alert("Y se ha agregado el almacén indicado");
            this.ip_uf_almacen.setValue({});
            return;
        }
        
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
    },
    detail:
    {
        init()
        {
            //modal
            this.modal_captura=document.getElementById("modal_captura");
            this.ik_producto=document.getElementById("ik_producto");
            this.cantidad=document.getElementById("cantidad");
            this.btn_regis_capture=document.getElementById("btn_regis_capture");

            this.referencia=document.getElementById("referencia");
            this.notas=document.getElementById("notas");
            this.tbl_detail_conteo_fisico=document.getElementById("tbl_detail_conteo_fisico");
            this.modal_fil_almacen=document.getElementById("modal_fil_almacen");
            this.td_saldo_fisico=document.getElementById("td_saldo_fisico");
            //summary
            this.summary_vfisico=document.getElementById("summary_vfisico");
            this.summary_vteorico=document.getElementById("summary_vteorico");
            this.summary_vdiferencia=document.getElementById("summary_vdiferencia");
            //labes
            this.mod_text_prod=document.getElementById("mod_text_prod");
            //
            this.file_import=document.getElementById("file_import");

            if(this.btn_regis_capture)this.btn_regis_capture.addEventListener("click",()=>{conteo.detail.Registrar();});
            if(this.modal_fil_almacen)this.modal_fil_almacen.addEventListener("change",()=>{conteo.detail.AddDataSourceProd();});
            if(conteo.detail.url_producto && this.modal_fil_almacen)
            {
                this.AddDataSourceProd();
            }
            setTimeout(() => 
            {
                conteo.detail.setSummary();    
            }, 200);
            if(this.ik_producto)this.ik_producto.addEventListener("change",()=>{conteo.detail.changeProducto()});
        },
        changeProducto()
        {
            var prod=this.ik_producto.getValue();
            if(!prod || !this.mod_text_prod)return;

            prod["almacen"]=this.modal_fil_almacen.value;
            
            var row=this.ExistRowProd(prod);
            let producto= row ? row.producto:prod.descripcion;
            let exist_teorico=row ? (row.exist_teorico??0):0;
            let exist_fisico=row ? (row.exist_fisico??0):0;

            if(this.mod_text_prod)this.mod_text_prod.innerHTML=producto+" <br> Existencia teórica: "+exist_teorico+". Existencia física: "+exist_fisico
        },
        AddDataSourceProd()
        {
            this.ik_producto.setAttribute("data-source",conteo.detail.url_producto.replaceAll("@almacen",this.modal_fil_almacen.value));
        },
        showModal()
        {
            this.CleanModal();
            
            if(this.tbl_detail_conteo_fisico)
            {
                var row_selected=this.tbl_detail_conteo_fisico.DataArray[this.tbl_detail_conteo_fisico.CurrentRowIndex()];
                if(row_selected && Object.keys(row_selected).length>0)
                {
                    this.referencia.value="REF_"+row_selected.cod_prod.trim().replaceAll(" ","");
                    this.notas.value=row_selected.producto;

                    var ndp=
                    {
                        codigo:row_selected.cod_prod,
                        sys_pk:row_selected.id_producto,
                        descripcion:row_selected.producto,
                        unidad:row_selected.unidad,
                        almacen:row_selected.id_almacen
                    }
                    this.modal_fil_almacen.value=row_selected.id_almacen;
                    if(this.ik_producto)this.ik_producto.setValue(ndp);
                }
            }
            if(this.modal_captura)tools.showModal("modal_captura");
        },
        CleanModal()
        {
            if(this.referencia)this.referencia.value="";
            if(this.notas)this.notas.value="";
            if(this.ik_producto)this.ik_producto.setValue({});
            if(this.cantidad)this.cantidad.value=1;
            if(this.mod_text_prod)this.mod_text_prod.innerHTML="";
        },
        ExistRowProd(data)
        {
            var row=null;
            if(this.tbl_detail_conteo_fisico.DataArray)
            {
                row=this.tbl_detail_conteo_fisico.DataArray.find((r)=>r.id_producto==data.sys_pk && r.id_almacen==data.almacen);
            }
            return row;
        },
        Registrar()
        {
            if(!this.referencia || this.referencia.value.trim()=="")
            {
                alert("Debe colocar un areferencia");
                this.referencia.focus();
                return;
            }
            if(!this.ik_producto)
            {
                console.warn("No hay un elemento producto");
                return;
            }
            
            var producto=this.ik_producto.getValue();
            if(!producto || Object.keys(producto).length <1)
            {
                alert("Debe seleccionar un producto");
                return;
            }

            if(!this.cantidad || this.cantidad.value.trim()=="")
            {
                alert("Debe colocar una cantidad");
                return;
            }

            producto["almacen"]=Number(this.modal_fil_almacen.value);
            var row=this.ExistRowProd(producto);
            
            if(!row || Object.keys(row).length<1)
            {
                let res=confirm("El producto indicado no se encuentra en la lista de detalle ¿Desea continuar?");
                if(!res)return;
            }
            
            var data=
            {
                producto:producto,
                cantidad:Number(this.cantidad.value??0),
                notas:this.notas.value??"",
                referencia:this.referencia.value.trim(),
                almacen:Number(this.modal_fil_almacen.value)
            }

            InduxsoftCrudlModel.InvokeService(`${conteo.detail.url_conteo}${this.id_conteo}/regitrar-capture/`, data,
                function (data) 
                {
                    if(this.td_saldo_fisico)this.td_saldo_fisico.textContent=data.sfisico;
                    if(row)
                    {
                        row["exist_fisico"]=data.cant_row_captura??0;
                        row["valorfisico"]=Number(row.exist_fisico??0) * Number(row.costopromedio??0);
                        row["diferenciavalor"]=Number(row.valorfisico) - Number(row.valorteorico);
                        row["diferencia"]=Number(row.exist_fisico??0) - Number(row.exist_teorico??0);

                        conteo.detail.tbl_detail_conteo_fisico._printRows();
                    }
                    // alert("Proceso capturado correctamente");
                    conteo.detail.CleanModal();
                    conteo.detail.setSummary();
                },
                function (error) 
                {
                    if (error.message) alert(error.message);
                    else console.error(error);
                }, "PATCH", false, false
            );
        },
        setSummary()
        {
            var array=conteo.detail.tbl_detail_conteo_fisico?.DataArray??[];
    
            if(!this.summary_vfisico || !this.summary_vteorico || !this.summary_vdiferencia)return;
    
            var vfisico=0,vteorico=0;
    
            for (let i = 0; i < array.length; i++) 
            {
                const row = array[i];
                vfisico+=Number(row.valorfisico??0);
                vteorico+=Number(row.valorteorico);
            }
            let diferencia=(vfisico - vteorico);
            this.summary_vfisico.textContent="$ " + vfisico;
            this.summary_vteorico.textContent="$ " + vteorico;
            this.summary_vdiferencia.textContent="$  "+ (diferencia>0 ? diferencia:vteorico);
        }
    }
    
}