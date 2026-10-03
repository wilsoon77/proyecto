import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_recipe_template():
    wb = openpyxl.Workbook()
    
    # -------------------------------------------------------------
    # Paleta de Colores Panadería Artesanal
    # -------------------------------------------------------------
    BROWN_DARK = "2B170F"      # Encabezados principales
    BROWN_MEDIUM = "5C3D2E"    # Subencabezados
    AMBER = "D97706"           # Acentos y advertencias
    CREAM = "FAF5EE"           # Fondo alternado
    CREAM_DARK = "DECDBB"      # Bordes
    GREEN_LIGHT = "E6F4EA"     # Recetas completas
    GREEN_TEXT = "137333"
    AMBER_LIGHT = "FEF7E0"     # Recetas pendientes
    AMBER_TEXT = "B06000"
    GRAY_LIGHT = "F8F9FA"
    WHITE = "FFFFFF"
    
    font_family = "Segoe UI"
    
    # Fuentes
    f_title = Font(name=font_family, size=16, bold=True, color=BROWN_DARK)
    f_subtitle = Font(name=font_family, size=11, italic=True, color="555555")
    f_section = Font(name=font_family, size=12, bold=True, color=BROWN_MEDIUM)
    f_header = Font(name=font_family, size=10, bold=True, color=WHITE)
    f_data = Font(name=font_family, size=10, color="222222")
    f_data_bold = Font(name=font_family, size=10, bold=True, color="222222")
    f_hint = Font(name=font_family, size=9, italic=True, color="777777")
    
    # Rellenos
    fill_header = PatternFill(start_color=BROWN_DARK, end_color=BROWN_DARK, fill_type="solid")
    fill_sub_header = PatternFill(start_color=BROWN_MEDIUM, end_color=BROWN_MEDIUM, fill_type="solid")
    fill_complete = PatternFill(start_color=GREEN_LIGHT, end_color=GREEN_LIGHT, fill_type="solid")
    fill_pending = PatternFill(start_color=AMBER_LIGHT, end_color=AMBER_LIGHT, fill_type="solid")
    fill_cream = PatternFill(start_color=CREAM, end_color=CREAM, fill_type="solid")
    fill_zebra = PatternFill(start_color=GRAY_LIGHT, end_color=GRAY_LIGHT, fill_type="solid")
    
    # Bordes
    border_thin = Border(
        left=Side(style='thin', color=CREAM_DARK),
        right=Side(style='thin', color=CREAM_DARK),
        top=Side(style='thin', color=CREAM_DARK),
        bottom=Side(style='thin', color=CREAM_DARK)
    )
    border_thick_bottom = Border(
        left=Side(style='thin', color=CREAM_DARK),
        right=Side(style='thin', color=CREAM_DARK),
        top=Side(style='thin', color=CREAM_DARK),
        bottom=Side(style='medium', color=BROWN_DARK)
    )
    
    align_center = Alignment(horizontal='center', vertical='center', wrap_text=True)
    align_left = Alignment(horizontal='left', vertical='center')
    align_right = Alignment(horizontal='right', vertical='center')
    align_wrap = Alignment(horizontal='left', vertical='center', wrap_text=True)

    # =============================================================
    # HOJA 1: INSTRUCCIONES
    # =============================================================
    ws_info = wb.active
    ws_info.title = "Instrucciones_y_Guía"
    ws_info.views.sheetView[0].showGridLines = True
    
    ws_info.merge_cells("B2:J2")
    ws_info["B2"] = "🥖 PANADERÍA SVETLANA — PLANTILLA OFICIAL DE RECETAS Y AMASIJOS"
    ws_info["B2"].font = f_title
    ws_info["B2"].alignment = Alignment(horizontal='left', vertical='center')
    
    ws_info.merge_cells("B3:J3")
    ws_info["B3"] = "Estimados dueños y maestros panaderos: Este documento servirá para cargar las recetas exactas de cada pan al sistema informático."
    ws_info["B3"].font = f_subtitle
    
    instructions = [
        ("1. ¿Por qué es necesaria esta plantilla?", 
         "El sistema de producción calcula automáticamente cuánta materia prima (harina, manteca, azúcar, levadura, etc.) se descuenta del inventario cada vez que se hornea pan. También calcula el costo por pieza y alerta cuando la harina o insumos están por agotarse."),
        
        ("2. Conceptos Clave del Sistema", 
         "• AMASIJO / TANDA: Es la preparación base de masa que se hace en la artesa/amasadora (por ejemplo: tanda de 50 lb o 25 lb de harina).\n"
         "• LATAS ESTÁNDAR: Es la cantidad de latas de pan que rinde ese amasijo completo (ejemplo: de 50 lb de harina para Francés salen 33 latas).\n"
         "• UNIDADES POR LATA: Cuántos panes caben en una sola lata de horneado (ejemplo: 36 franceses por lata, o 24 donas por lata).\n"
         "• TOTAL DE PANES CALCULADOS: El sistema multiplica automáticamente (Latas × Unidades por Lata = Total Panes)."),
        
        ("3. ¿Cómo llenar la hoja 'Plantilla_Recetas'?", 
         "1. Ve a la pestaña 'Plantilla_Recetas'.\n"
         "2. Verás los 18 productos que producimos en Panadería Svetlana.\n"
         "3. Las 3 primeras filas (en color verde) son las que ya están en el sistema como ejemplo real (Francés, Pan Dulce Grande y Empanada de Piña).\n"
         "4. En las filas amarillas (pendientes), solo debes escribir el rendimiento en latas y los ingredientes principales de tu amasijo habitual.\n"
         "5. Si un pan comparte la misma masa que otro (por ejemplo: Pan Dulce Pequeño usa la misma masa que el Pan Dulce Grande pero con diferente corte), indícalo en Observaciones o anota sus latas correspondientes."),
        
        ("4. Consulta de Materias Primas", 
         "En la pestaña 'Catálogo_Materias_Primas' tienes el listado de todos los insumos ya registrados en el sistema con su unidad de medida (Libras para sólidos, Mililitros para líquidos, Unidades para huevos o mangas de jalea).")
    ]
    
    row_idx = 5
    for title, text in instructions:
        ws_info.cell(row=row_idx, column=2, value=title).font = f_section
        row_idx += 1
        
        cell_text = ws_info.cell(row=row_idx, column=2, value=text)
        cell_text.font = f_data
        cell_text.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
        ws_info.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx+2 if '\n' in text else row_idx+1, end_column=10)
        row_idx += 3 if '\n' in text else 2
        row_idx += 1
        
    ws_info.column_dimensions['A'].width = 3
    ws_info.column_dimensions['B'].width = 25
    for col_l in ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
        ws_info.column_dimensions[col_l].width = 15

    # =============================================================
    # HOJA 2: PLANTILLA PRINCIPAL DE RECETAS
    # =============================================================
    ws_rec = wb.create_sheet(title="Plantilla_Recetas")
    ws_rec.views.sheetView[0].showGridLines = True
    
    # Encabezado superior
    ws_rec.merge_cells("A1:R1")
    ws_rec["A1"] = "RECETARIO Y RENDIMIENTO DE PRODUCCIÓN — PANADERÍA SVETLANA"
    ws_rec["A1"].font = Font(name=font_family, size=14, bold=True, color=WHITE)
    ws_rec["A1"].fill = fill_header
    ws_rec["A1"].alignment = align_center
    ws_rec.row_dimensions[1].height = 35
    
    headers = [
        ("ID", 6, align_center),
        ("Categoría", 13, align_center),
        ("Producto Terminado", 24, align_left),
        ("Estado", 14, align_center),
        ("Nombre del Amasijo / Tanda", 28, align_left),
        ("Latas por Amasijo", 12, align_center),
        ("Unidades por Lata", 12, align_center),
        ("Total Panes (Calculado)", 15, align_center),
        ("Harina Principal (LB)", 14, align_center),
        ("Tipo Harina (Dura/Suave)", 14, align_center),
        ("Manteca / Margarina (LB)", 14, align_center),
        ("Azúcar (LB)", 12, align_center),
        ("Levadura (LB)", 12, align_center),
        ("Sal (LB)", 10, align_center),
        ("Huevos (Uds)", 12, align_center),
        ("Líquidos (Agua/Leche)", 15, align_left),
        ("Otros Ingredientes / Relleno / Toppings", 35, align_left),
        ("Observaciones / Detalles del Maestro", 30, align_left),
    ]
    
    ws_rec.row_dimensions[2].height = 28
    for col_idx, (h_name, width, h_align) in enumerate(headers, start=1):
        c = ws_rec.cell(row=2, column=col_idx, value=h_name)
        c.font = f_header
        c.fill = fill_sub_header
        c.alignment = align_center
        c.border = border_thick_bottom
        col_letter = get_column_letter(col_idx)
        ws_rec.column_dimensions[col_letter].width = width

    # Datos de los 18 productos
    # Formato: (id, categoria, nombre_prod, estado, nombre_amasijo, latas, uds_lata, harina_lb, tipo_harina, manteca_lb, azucar_lb, levadura_lb, sal_lb, huevos, liquidos, otros, obs)
    products_data = [
        # 3 EXISTENTES (Ejemplo Real)
        (54, "Pan", "Pan Francés Tradicional", "REGISTRADA", "Amasijo Estándar de Francés (50 lb)", 33, 36, 50, "Dura", 3, 1, 2, 1, 0, "Agua ~30 L (al gusto)", "Ninguno", "Receta actual en sistema. Rinde 1,188 panes."),
        (56, "Pan Dulce", "Pan Dulce Grande", "REGISTRADA", "Amasijo Estándar de Masa Dulce (50 lb)", 15, 20, 50, "Suave", 8, 15, 1.5, 0.5, 25, "Agua según textura", "Esencia Vainilla (250 ml), Solución Yemas (100 ml)", "Receta actual en sistema. Rinde 300 panes."),
        (62, "Reposteria", "Empanada de Piña", "REGISTRADA", "Amasijo Estándar de Masa Danesa (25 lb)", 12, 16, 25, "Suave", 8, 5, 0.5, 0.25, 15, "Agua según textura", "Manga de Jalea de Piña para relleno", "Receta actual en sistema. Rinde 192 empanadas."),
        
        # 15 PENDIENTES
        (55, "Pan Dulce", "Pan Dulce Pequeño", "PENDIENTE", "", "", 40, "", "", "", "", "", "", "", "", "", "Misma masa dulce o masa específica. Caben 40 por lata."),
        (68, "Pan Dulce", "Campechana", "PENDIENTE", "", "", 20, "", "", "", "", "", "", "", "", "", "Lleva azúcar espolvoreada y corte tradicional."),
        (69, "Pan Dulce", "Pasitas", "PENDIENTE", "", "", 30, "", "", "", "", "", "", "", "", "", "Masa dulce con pasas incorporadas."),
        (59, "Galletas", "Champurrada Grande", "PENDIENTE", "", "", 15, "", "", "", "", "", "", "", "", "", "Tradicional tostada, ajonjolí encima."),
        (58, "Galletas", "Champurrada Pequeña", "PENDIENTE", "", "", 24, "", "", "", "", "", "", "", "", "", "Tamaño café/desayuno."),
        (57, "Galletas", "Pan Galleta", "PENDIENTE", "", "", 20, "", "", "", "", "", "", "", "", "", "Pan tostado crujiente."),
        (64, "Galletas", "Polvorosa Tradicional", "PENDIENTE", "", "", 15, "", "", "", "", "", "", "", "", "", "Polvorosa suave y desmoronable."),
        (60, "Reposteria", "Cubilete de Vainilla", "PENDIENTE", "", "", 30, "", "", "", "", "", "", "", "", "", "Masa batida, requiere molde de cubilete y pasas."),
        (61, "Reposteria", "Cubilete de Banano", "PENDIENTE", "", "", 30, "", "", "", "", "", "", "", "", "", "Lleva banano maduro triturado y canela."),
        (63, "Reposteria", "Empanada de Manjar", "PENDIENTE", "", "", 16, "", "", "", "", "", "", "", "", "", "Masa danesa o suave, relleno con manga de manjar."),
        (70, "Reposteria", "Cortada de Fresa", "PENDIENTE", "", "", 14, "", "", "", "", "", "", "", "", "", "Pastel/cortada con jalea de fresa."),
        (71, "Reposteria", "Cortada de Chocolate", "PENDIENTE", "", "", 14, "", "", "", "", "", "", "", "", "", "Con cocoa oscura o cobertura de chocolate."),
        (65, "Donas", "Dona Simple Glaseada", "PENDIENTE", "", "", 24, "", "", "", "", "", "", "", "", "", "Masa para freír/hornear, glaseado blanco."),
        (66, "Donas", "Dona Rellena de Manjar", "PENDIENTE", "", "", 24, "", "", "", "", "", "", "", "", "", "Relleno manjar artesanal."),
        (67, "Donas", "Dona Rellena de Fresa", "PENDIENTE", "", "", 24, "", "", "", "", "", "", "", "", "", "Relleno jalea de fresa.")
    ]
    
    current_row = 3
    for p in products_data:
        is_registered = p[3] == "REGISTRADA"
        ws_rec.row_dimensions[current_row].height = 24
        
        # Columna A: ID
        cA = ws_rec.cell(row=current_row, column=1, value=p[0])
        cA.alignment = align_center
        cA.font = f_hint
        cA.border = border_thin
        
        # Columna B: Categoría
        cB = ws_rec.cell(row=current_row, column=2, value=p[1])
        cB.alignment = align_center
        cB.font = f_data_bold
        cB.border = border_thin
        
        # Columna C: Producto Terminado
        cC = ws_rec.cell(row=current_row, column=3, value=p[2])
        cC.alignment = align_left
        cC.font = f_data_bold
        cC.border = border_thin
        
        # Columna D: Estado
        cD = ws_rec.cell(row=current_row, column=4, value="✅ " + p[3] if is_registered else "⏳ " + p[3])
        cD.alignment = align_center
        cD.font = Font(name=font_family, size=9, bold=True, color=GREEN_TEXT if is_registered else AMBER_TEXT)
        cD.fill = fill_complete if is_registered else fill_pending
        cD.border = border_thin
        
        # Columna E: Nombre Amasijo
        cE = ws_rec.cell(row=current_row, column=5, value=p[4])
        cE.alignment = align_left
        cE.font = f_data
        cE.border = border_thin
        
        # Columna F: Latas
        cF = ws_rec.cell(row=current_row, column=6, value=p[5] if p[5] != "" else None)
        cF.alignment = align_center
        cF.font = f_data_bold
        cF.border = border_thin
        if isinstance(p[5], (int, float)):
            cF.number_format = '#,##0'
            
        # Columna G: Unidades por Lata
        cG = ws_rec.cell(row=current_row, column=7, value=p[6])
        cG.alignment = align_center
        cG.font = f_data_bold
        cG.border = border_thin
        cG.number_format = '#,##0'
        
        # Columna H: Total Panes (FÓRMULA EXCEL: Latas * Unidades/Lata)
        cH = ws_rec.cell(row=current_row, column=8, value=f"=IF(F{current_row}>0, F{current_row}*G{current_row}, \"-\")")
        cH.alignment = align_center
        cH.font = Font(name=font_family, size=10, bold=True, color=BROWN_MEDIUM)
        cH.border = border_thin
        cH.number_format = '#,##0'
        
        # Columna I: Harina (LB)
        cI = ws_rec.cell(row=current_row, column=9, value=p[7] if p[7] != "" else None)
        cI.alignment = align_center
        cI.font = f_data
        cI.border = border_thin
        
        # Columna J: Tipo Harina
        cJ = ws_rec.cell(row=current_row, column=10, value=p[8])
        cJ.alignment = align_center
        cJ.font = f_data
        cJ.border = border_thin
        
        # Columna K: Manteca
        cK = ws_rec.cell(row=current_row, column=11, value=p[9] if p[9] != "" else None)
        cK.alignment = align_center
        cK.font = f_data
        cK.border = border_thin
        
        # Columna L: Azúcar
        cL = ws_rec.cell(row=current_row, column=12, value=p[10] if p[10] != "" else None)
        cL.alignment = align_center
        cL.font = f_data
        cL.border = border_thin
        
        # Columna M: Levadura
        cM = ws_rec.cell(row=current_row, column=13, value=p[11] if p[11] != "" else None)
        cM.alignment = align_center
        cM.font = f_data
        cM.border = border_thin
        
        # Columna N: Sal
        cN = ws_rec.cell(row=current_row, column=14, value=p[12] if p[12] != "" else None)
        cN.alignment = align_center
        cN.font = f_data
        cN.border = border_thin
        
        # Columna O: Huevos
        cO = ws_rec.cell(row=current_row, column=15, value=p[13] if p[13] != "" else None)
        cO.alignment = align_center
        cO.font = f_data
        cO.border = border_thin
        
        # Columna P: Líquidos
        cP = ws_rec.cell(row=current_row, column=16, value=p[14])
        cP.alignment = align_left
        cP.font = f_data
        cP.border = border_thin
        
        # Columna Q: Otros Ingredientes
        cQ = ws_rec.cell(row=current_row, column=17, value=p[15])
        cQ.alignment = align_wrap
        cQ.font = f_data
        cQ.border = border_thin
        
        # Columna R: Observaciones
        cR = ws_rec.cell(row=current_row, column=18, value=p[16])
        cR.alignment = align_wrap
        cR.font = f_hint
        cR.border = border_thin
        
        # Fondo sutil para las filas
        row_fill = fill_complete if is_registered else (fill_cream if current_row % 2 == 0 else fill_zebra)
        for col_idx in [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]:
            if not is_registered:
                ws_rec.cell(row=current_row, column=col_idx).fill = row_fill
            else:
                ws_rec.cell(row=current_row, column=col_idx).fill = fill_complete

        current_row += 1

    # Inmovilizar paneles para que la cabecera quede fija al scrollear
    ws_rec.freeze_panes = "D3"

    # =============================================================
    # HOJA 3: CATÁLOGO DE MATERIAS PRIMAS REGISTRADAS
    # =============================================================
    ws_mp = wb.create_sheet(title="Catálogo_Materias_Primas")
    ws_mp.views.sheetView[0].showGridLines = True
    
    ws_mp.merge_cells("A1:E1")
    ws_mp["A1"] = "CATÁLOGO DE MATERIAS PRIMAS (INSUMOS) DISPONIBLES EN EL SISTEMA"
    ws_mp["A1"].font = Font(name=font_family, size=13, bold=True, color=WHITE)
    ws_mp["A1"].fill = fill_header
    ws_mp["A1"].alignment = align_center
    ws_mp.row_dimensions[1].height = 32
    
    mp_headers = [
        ("ID", 8, align_center),
        ("Nombre del Insumo / Materia Prima", 35, align_left),
        ("Unidad de Medida del Sistema", 28, align_center),
        ("Abreviatura", 14, align_center),
        ("Uso Típico en Panadería", 35, align_left)
    ]
    
    ws_mp.row_dimensions[2].height = 26
    for col_idx, (h_name, width, h_align) in enumerate(mp_headers, start=1):
        c = ws_mp.cell(row=2, column=col_idx, value=h_name)
        c.font = f_header
        c.fill = fill_sub_header
        c.alignment = align_center
        c.border = border_thick_bottom
        col_letter = get_column_letter(col_idx)
        ws_mp.column_dimensions[col_letter].width = width

    raw_materials_list = [
        (1, "Harina", "Libras", "LB", "Harina tradicional / multipropósito"),
        (47, "Harina Dura", "Libras", "LB", "Para pan francés, masas con alto gluten"),
        (48, "Harina Suave", "Libras", "LB", "Para pan dulce, repostería y galletas"),
        (2, "Levadura", "Libras", "LB", "Levadura fresca o seca (1 lb = 16 oz)"),
        (5, "Azúcar", "Libras", "LB", "Azúcar estándar"),
        (49, "Azúcar Blanca", "Libras", "LB", "Para masas finas, cubiletes y brillo"),
        (4, "Manteca", "Libras", "LB", "Manteca clásica de horneado"),
        (52, "Manteca Vegetal", "Libras", "LB", "Para pan dulce y textura crujiente"),
        (53, "Margarina", "Libras", "LB", "Para masa danesa, hojaldres y donas"),
        (3, "Sal", "Libras", "LB", "Sal fina de mesa"),
        (51, "Huevos", "Unidades individuales", "UNIT", "Huevos enteros por pieza"),
        (54, "Polvo de Hornear (Royal)", "Libras", "LB", "Leudante químico para cubiletes"),
        (64, "Bicarbonato de Sodio", "Unidades / Cucharadas", "UNIT", "Para galletas y cubilete de banano"),
        (56, "Esencia de Vainilla", "Mililitros", "ML", "Aromatizante (1 taza = 250 ml)"),
        (57, "Esencia de Ponche de Frutas", "Mililitros", "ML", "Aromatizante especial de panadería"),
        (58, "Solución de Yemas", "Mililitros", "ML", "Para pintar y dorar la corteza"),
        (80, "Leche Entera", "Mililitros", "ML", "Líquido de amasado (1 litro = 1,000 ml)"),
        (60, "Manga de Jalea de Piña", "Unidades (Mangas)", "UNIT", "Relleno pastelero para empanadas"),
        (61, "Manga de Jalea de Fresa", "Unidades (Mangas)", "UNIT", "Relleno para donas y cortadas"),
        (62, "Manga de Manjar", "Unidades (Mangas)", "UNIT", "Relleno para donas y empanadas"),
        (59, "Molde de Cubilete", "Unidades (Capacillos)", "UNIT", "Papel / capacillo para hornear"),
        (77, "Chocolate en Barra (Repostería)", "Libras", "LB", "Para cortadas y coberturas"),
        (63, "Cocoa Oscura", "Libras", "LB", "Para masas de chocolate"),
        (82, "Canela en Polvo", "Libras", "LB", "Especia para cubiletes y pan dulce"),
        (74, "Ajonjolí", "Libras", "LB", "Semilla para decorar champurradas"),
        (76, "Anís", "Libras", "LB", "Semilla aromática tradicional"),
        (81, "Banano", "Unidades (Plátano/Banano)", "UNIT", "Fruta natural para cubilete de banano"),
        (73, "Pasas", "Libras", "LB", "Para pasitas y cubiletes"),
    ]
    
    for r_idx, (rm_id, rm_name, rm_unit, rm_abbr, rm_use) in enumerate(raw_materials_list, start=3):
        ws_mp.row_dimensions[r_idx].height = 20
        c1 = ws_mp.cell(row=r_idx, column=1, value=rm_id)
        c1.alignment = align_center
        c1.font = f_hint
        c1.border = border_thin
        
        c2 = ws_mp.cell(row=r_idx, column=2, value=rm_name)
        c2.alignment = align_left
        c2.font = f_data_bold
        c2.border = border_thin
        
        c3 = ws_mp.cell(row=r_idx, column=3, value=rm_unit)
        c3.alignment = align_center
        c3.font = f_data
        c3.border = border_thin
        
        c4 = ws_mp.cell(row=r_idx, column=4, value=rm_abbr)
        c4.alignment = align_center
        c4.font = Font(name=font_family, size=10, bold=True, color=BROWN_MEDIUM)
        c4.fill = fill_cream
        c4.border = border_thin
        
        c5 = ws_mp.cell(row=r_idx, column=5, value=rm_use)
        c5.alignment = align_left
        c5.font = f_data
        c5.border = border_thin
        
        if r_idx % 2 == 0:
            for ci in [1, 2, 3, 5]:
                ws_mp.cell(row=r_idx, column=ci).fill = fill_zebra

    # =============================================================
    # HOJA 4: FORMATO VERTICAL POR INGREDIENTE (Para recetas complejas)
    # =============================================================
    ws_vert = wb.create_sheet(title="Formato_Detallado_Ingredientes")
    ws_vert.views.sheetView[0].showGridLines = True
    
    ws_vert.merge_cells("A1:G1")
    ws_vert["A1"] = "DETALLE DE INGREDIENTES LÍNEA POR LÍNEA (OPCIONAL / ALTERNATIVO)"
    ws_vert["A1"].font = Font(name=font_family, size=13, bold=True, color=WHITE)
    ws_vert["A1"].fill = fill_header
    ws_vert["A1"].alignment = align_center
    ws_vert.row_dimensions[1].height = 32
    
    v_headers = [
        ("Producto Terminado", 26, align_left),
        ("Nombre de la Receta", 32, align_left),
        ("Latas por Tanda", 15, align_center),
        ("Ingrediente / Insumo", 28, align_left),
        ("Cantidad", 12, align_center),
        ("Unidad (LB / ML / UNIT)", 22, align_center),
        ("Notas de Preparación", 35, align_left)
    ]
    
    ws_vert.row_dimensions[2].height = 26
    for col_idx, (h_name, width, h_align) in enumerate(v_headers, start=1):
        c = ws_vert.cell(row=2, column=col_idx, value=h_name)
        c.font = f_header
        c.fill = fill_sub_header
        c.alignment = align_center
        c.border = border_thick_bottom
        col_letter = get_column_letter(col_idx)
        ws_vert.column_dimensions[col_letter].width = width

    # Ejemplos reales en formato vertical
    sample_vertical = [
        ("Pan Francés Tradicional", "Amasijo Estándar de Francés (50 lb)", 33, "Harina Dura", 50, "LB", "Harina de fuerza base"),
        ("Pan Francés Tradicional", "Amasijo Estándar de Francés (50 lb)", 33, "Levadura", 2, "LB", "Disolver en agua tibia"),
        ("Pan Francés Tradicional", "Amasijo Estándar de Francés (50 lb)", 33, "Manteca Vegetal", 3, "LB", "Integrar al final del amasado"),
        ("Pan Francés Tradicional", "Amasijo Estándar de Francés (50 lb)", 33, "Azúcar Blanca", 1, "LB", "Alimenta la levadura"),
        ("Pan Francés Tradicional", "Amasijo Estándar de Francés (50 lb)", 33, "Sal", 1, "LB", "Control de fermentación"),
        
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Harina Suave", 50, "LB", "Harina repostera"),
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Azúcar Blanca", 15, "LB", "Masa dulce tradicional"),
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Manteca Vegetal", 8, "LB", "Punto pomada"),
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Huevos", 25, "UNIT", "Enteros frescos"),
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Levadura", 1.5, "LB", "Fermentación media"),
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Sal", 0.5, "LB", "Realce de sabor"),
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Esencia de Vainilla", 250, "ML", "Sabor clásico"),
        ("Pan Dulce Grande", "Amasijo Estándar de Masa Dulce (50 lb)", 15, "Solución de Yemas", 100, "ML", "Para pintar antes de hornear"),
        
        ("Empanada de Piña", "Amasijo Estándar de Masa Danesa (25 lb)", 12, "Harina Suave", 25, "LB", "Base masa laminada"),
        ("Empanada de Piña", "Amasijo Estándar de Masa Danesa (25 lb)", 12, "Margarina", 8, "LB", "Empaste para hojaldrar"),
        ("Empanada de Piña", "Amasijo Estándar de Masa Danesa (25 lb)", 12, "Azúcar Blanca", 5, "LB", "Dulzura suave"),
        ("Empanada de Piña", "Amasijo Estándar de Masa Danesa (25 lb)", 12, "Huevos", 15, "UNIT", "Elasticidad"),
        ("Empanada de Piña", "Amasijo Estándar de Masa Danesa (25 lb)", 12, "Levadura", 0.5, "LB", "Poco leudado"),
        ("Empanada de Piña", "Amasijo Estándar de Masa Danesa (25 lb)", 12, "Sal", 0.25, "LB", "Equilibrio"),
        ("Empanada de Piña", "Amasijo Estándar de Masa Danesa (25 lb)", 12, "Manga de Jalea de Piña", 2, "UNIT", "Relleno al cerrar"),
    ]

    for r_idx, row_vals in enumerate(sample_vertical, start=3):
        ws_vert.row_dimensions[r_idx].height = 20
        for col_idx, val in enumerate(row_vals, start=1):
            cell = ws_vert.cell(row=r_idx, column=col_idx, value=val)
            cell.font = f_data
            cell.border = border_thin
            if col_idx in [3, 5, 6]:
                cell.alignment = align_center
            else:
                cell.alignment = align_left
            if r_idx % 2 == 0:
                cell.fill = fill_zebra

    # Filas vacías adicionales listas para llenar
    for r_idx in range(len(sample_vertical) + 3, len(sample_vertical) + 30):
        ws_vert.row_dimensions[r_idx].height = 20
        for col_idx in range(1, 8):
            cell = ws_vert.cell(row=r_idx, column=col_idx)
            cell.border = border_thin
            cell.font = f_data
            if col_idx in [3, 5, 6]:
                cell.alignment = align_center
            if r_idx % 2 == 0:
                cell.fill = fill_cream

    # Guardar en raíz del proyecto
    output_path = os.path.join(os.getcwd(), "PLANTILLA_RECETAS_PANADERIA_SVETLANA.xlsx")
    wb.save(output_path)
    print(f"Excel creado exitosamente en: {output_path}")

if __name__ == "__main__":
    create_recipe_template()
