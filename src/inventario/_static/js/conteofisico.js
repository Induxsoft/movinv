document.addEventListener("DOMContentLoaded",()=>
{
    conteo.init();
    conteo.detail.init();
});
document.addEventListener("keydown",(e)=>
{
    // conteo.KeyDown(e);
});
var conteo=
{
    url_almacen:"",
    init()
    {
        this.ip_uf_almacen=document.getElementById("ip_uf_almacen");
        this.tbl_almacenes=document.getElementById("tbl_almacenes");
        this.nombre=document.getElementById("nombre");
        this.aleatorio=document.getElementById("aleatorio");
        this.articulos=document.getElementById("articulos");

        if(this.ip_uf_almacen)this.ip_uf_almacen.addEventListener("change",(data)=>{conteo.AddDataTable(data);});
        if(this.aleatorio)this.aleatorio.addEventListener("change",()=>{conteo.enabledArticulos();});
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
    KeyDown(e)
    {
        var keyCode = e.keyCode;
        // console.log(keyCode);
        switch(keyCode)
        {
            case 113://f2
            conteo.detail.btn_new_captura.click();
            break;
            case 114://f3
            conteo.detail.btn_captura.click();
            break;
            // case 115://f4
            // conteo.detail.btn_cerrar_conteo.click();
            // break;
            // case 117://f6
            // conteo.detail.btn_sincronizar.click();
            // break;
        }
    },
    CerrarConteo(sys_pk)
    {
        let res=confirm("¿Seguro desea cerrar el conteo físico (no podrá continuar capturando la existencia física)?");
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

            //buttons details
            this.btn_new_captura=document.getElementById("btn_new_captura");
            this.btn_captura=document.getElementById("btn_captura");
            this.btn_cerrar_conteo=document.getElementById("btn_cerrar_conteo");
            this.btn_sincronizar=document.getElementById("btn_sincronizar");
            
            this.all_almacen=document.getElementById("all_almacen");
            if(this.all_almacen)this.all_almacen.addEventListener("change",()=>{this.GetAlmacenes();});
            
            this.SetFieldsModal("modal_captura");
        },
        GetAlmacenes()
        {
            if(conteo.url_almacen.trim()=="")return;
            
            let url="";
            if(this.all_almacen.checked)url=conteo.url_almacen.replace("@search","%");
            else url=conteo.url_almacen.replace("@search","%").replace("false",true);

            url=url.replace("@id",this.id_conteo);

            InduxsoftCrudlModel.InvokeService(url, null,
                function (data) 
                {
                    conteo.detail.LoadOptionsSelect(conteo.detail.modal_fil_almacen,data);
                },
                function (error) 
                {
                    if (error.message) alert(error.message);
                    else console.error(error);
                }, "GET", false, false
            );
        },
        LoadOptionsSelect(select,data,key="sys_pk",value="descripcion")
        {
            if(!select || !data)return;
            
            var html="";
            for (let i = 0; i < data.length; i++) 
            {
                const item = data[i];
                html+=`<option value="${eval("item."+key)}">${eval("item."+value)}</option>`;
            }
            select.innerHTML=html;
        },
        TabsById(idOrName,id_container_elements)
        {
            if(id_container_elements.trim()=="")return;

            var element=document.getElementById(id_container_elements);
            if(!element)return;
            
            var elements=element.querySelectorAll("button,input,select,textarea,input-key");
            
            for (let i = 0; i < elements.length; i++) 
            {
                const alm = elements[i];
                if(alm)
                {
                    if((alm.id??"").trim()==idOrName.trim() || (alm.name??"").trim()==idOrName.trim())
                    {
                        var elm_tab=elements[i+1];
                        if(elm_tab)elm_tab.focus();
                    }
                }
            }
        },  
        setEvents(idcontainer_modal="")
        {
            if(this.btn_regis_capture)this.btn_regis_capture.setAttribute("onclick",'conteo.detail.Registrar();');
            if(this.modal_fil_almacen)this.modal_fil_almacen.setAttribute("onchange",'conteo.detail.AddDataSourceProd();');

            if(conteo.detail.url_producto && this.modal_fil_almacen)
            {
                this.AddDataSourceProd();
            }
            setTimeout(() => 
            {
                conteo.detail.setSummary();  
            }, 200);
            if(this.ik_producto)this.ik_producto.addEventListener("change",()=>{conteo.detail.changeProducto()});

            if(this.cantidad)this.cantidad.addEventListener("keypress",(e)=>
            {
                if (e.key === "Enter") 
                {
                    conteo.detail.TabsById(this.cantidad.id,idcontainer_modal);
                }
            });
        },
        SetFieldsModal(idmodal)
        {
            var modal=document.getElementById(idmodal);
            if(!modal)return;
            this.modal_fil_almacen=null;

            this.ik_producto=modal.querySelector("#ik_producto");
            this.cantidad=modal.querySelector("#cantidad");
            this.referencia=modal.querySelector("#referencia");
            this.notas=modal.querySelector("#notas");
            this.modal_fil_almacen=modal.querySelector("#modal_fil_almacen");
            this.mod_text_prod=modal.querySelector("#mod_text_prod");
            this.btn_regis_capture=modal.querySelector("#btn_regis_capture");

            this.setEvents(idmodal);
        },
        Capturas()
        {
            var row=this.tbl_detail_conteo_fisico.DataArray[this.tbl_detail_conteo_fisico.CurrentRowIndex()];
            if(!row || Object.keys(row).length<1)
            {
                alert("Debe seleccionar un elemento de la tabla");
                return;
            }

            let title=(row.producto??"") + " - "+(conteo.data.nombre??"")
            let url=conteo.detail.url_report_captura.replaceAll("@alm",row.id_almacen??0).replaceAll("@prod",row.id_producto??0).replaceAll("@title",tools.url_encode(title));
            url=url.replaceAll("@url_exit",tools.url_encode(conteo.current_url));
            window.location.href=url;
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
            
            if(this.mod_text_prod)this.mod_text_prod.innerHTML=producto+" <br> Existencia teórica: "+exist_teorico+". Existencia física: "+exist_fisico;

            if(this.referencia && this.referencia.value=="")this.referencia.value=(prod.codigo??"").trim().replaceAll(" ","");
            if(this.notas && this.notas.value=="")this.notas.value=producto??"";

            if(this.cantidad)this.cantidad.select();
        },
        AddDataSourceProd()
        {
            this.ik_producto.setAttribute("data-source",conteo.detail.url_producto.replaceAll("@almacen",this.modal_fil_almacen.value));
        },
        ismodalblank:false,
        showModal(idmodal="modal_captura")
        {
            this.SetFieldsModal(idmodal);
            this.CleanModal();

            if(this.ik_producto)this.ik_producto.removeAttribute("disabled");
            if(this.modal_fil_almacen)
            {
                this.modal_fil_almacen.disabled=false;
            }
            
            var row_selected=null;
            if(idmodal=="modal_captura")
            {
                row_selected=this.tbl_detail_conteo_fisico.DataArray[this.tbl_detail_conteo_fisico.CurrentRowIndex()];
                if(this.ik_producto)this.ik_producto.setAttribute("disabled",true);
                if(this.modal_fil_almacen)this.modal_fil_almacen.disabled=true;
                if(!row_selected)
                {
                    alert("Debe selecciona un elemento de la tabla");
                    return;
                }
            }else{this.ismodalblank=true;}

            if(this.tbl_detail_conteo_fisico && idmodal=="modal_captura")
            {
                if(row_selected && Object.keys(row_selected).length>0)
                {
                    this.referencia.value=row_selected.cod_prod.trim().replaceAll(" ","");
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
            tools.showModal(idmodal);

            setTimeout(() => {
                if(this.ismodalblank && this.modal_fil_almacen)
                {
                    this.modal_fil_almacen.focus();
                } 
                else if(this.cantidad)
                {
                    this.cantidad.focus();
                }
            }, 400);
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
            // if(!this.referencia || this.referencia.value.trim()=="")
            // {
            //     alert("Debe colocar un areferencia");
            //     this.referencia.focus();
            //     return;
            // }
            if(!this.ik_producto)
            {
                console.warn("No hay un elemento producto");
                return;
            }
            
            var producto=this.ik_producto.getValue();
            
            if(!producto || Object.keys(producto).length <1 || (producto.sys_pk??0)<1)
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
            
            // if(!row || Object.keys(row).length<1)
            // {
            //     let res=confirm("El producto indicado no se encuentra en la lista de detalle ¿Desea continuar?");
            //     if(!res)return;
            // }
            
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
                    // alert("Proceso capturado correctamente");
                    
                    if(this.td_saldo_fisico)this.td_saldo_fisico.textContent=data.sfisico;
                    if(row)
                    {
                        row["exist_fisico"]=data.cant_row_captura??0;
                        row["valorfisico"]=Number(row.exist_fisico??0) * Number(row.costopromedio??0);
                        row["diferenciavalor"]=Number(row.valorfisico) - Number(row.valorteorico);
                        row["diferencia"]=Number(row.exist_fisico??0) - Number(row.exist_teorico??0);

                        conteo.detail.tbl_detail_conteo_fisico._printRows();
                    }
                    setTimeout(() => 
                    {
                        if(conteo.detail.ismodalblank)
                        {
                            conteo.detail.modal_fil_almacen.focus();
                        }
                    }, 300);

                    if(!conteo.detail.ismodalblank)
                    {
                        tools.hideModal('modal_captura');
                    }
                    
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
            this.summary_vfisico.textContent="$ " + Math.RoundTo(vfisico,2);
            this.summary_vteorico.textContent="$ " + Math.RoundTo(vteorico,2);
            this.summary_vdiferencia.textContent="$  "+ Math.RoundTo(diferencia,2);
        }
    }
    
}