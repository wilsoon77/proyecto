import os
import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_september_excel():
    wb = openpyxl.Workbook()
    
    # -------------------------------------------------------------
    # Paleta de Colores Panadería Artesanal
    # -------------------------------------------------------------
    BROWN_DARK = "2B170F"      # Encabezados principales
    BROWN_MEDIUM = "5C3D2E"    # Subencabezados
    AMBER = "D97706"           # Acentos y totales
    CREAM = "FAF5EE"           # Fondo suave alternado
    CREAM_DARK = "DECDBB"      # Bordes
    GREEN_LIGHT = "E6F4EA"     # Valores de venta / éxito
    GREEN_TEXT = "137333"
    AMBER_LIGHT = "FEF7E0"     # Sobrantes / atención
    AMBER_TEXT = "B06000"
    GRAY_LIGHT = "F8F9FA"
    WHITE = "FFFFFF"
    
    font_family = "Segoe UI"
    
    # Estilos de texto
    f_title = Font(name=font_family, size=15, bold=True, color=WHITE)
    f_sheet_title = Font(name=font_family, size=15, bold=True, color=BROWN_DARK)
    f_subtitle = Font(name=font_family, size=10, italic=True, color="555555")
    f_section = Font(name=font_family, size=11, bold=True, color=BROWN_MEDIUM)
    f_header = Font(name=font_family, size=10, bold=True, color=WHITE)
    f_header_sub = Font(name=font_family, size=9, bold=True, color=WHITE)
    f_data = Font(name=font_family, size=9, color="222222")
    f_data_bold = Font(name=font_family, size=9, bold=True, color="222222")
    f_total_bold = Font(name=font_family, size=10, bold=True, color=BROWN_DARK)
    f_hint = Font(name=font_family, size=8, italic=True, color="777777")
    
    # Rellenos
    fill_header = PatternFill(start_color=BROWN_DARK, end_color=BROWN_DARK, fill_type="solid")
    fill_sub_header = PatternFill(start_color=BROWN_MEDIUM, end_color=BROWN_MEDIUM, fill_type="solid")
    fill_amber_header = PatternFill(start_color=AMBER, end_color=AMBER, fill_type="solid")
    fill_cream = PatternFill(start_color=CREAM, end_color=CREAM, fill_type="solid")
    fill_zebra = PatternFill(start_color=GRAY_LIGHT, end_color=GRAY_LIGHT, fill_type="solid")
    fill_green = PatternFill(start_color=GREEN_LIGHT, end_color=GREEN_LIGHT, fill_type="solid")
    fill_amber = PatternFill(start_color=AMBER_LIGHT, end_color=AMBER_LIGHT, fill_type="solid")
    
    # Bordes
    border_thin = Border(
        left=Side(style='thin', color=CREAM_DARK),
        right=Side(style='thin', color=CREAM_DARK),
        top=Side(style='thin', color=CREAM_DARK),
        bottom=Side(style='thin', color=CREAM_DARK)
    )
    border_total = Border(
        left=Side(style='thin', color=CREAM_DARK),
        right=Side(style='thin', color=CREAM_DARK),
        top=Side(style='thin', color=BROWN_DARK),
        bottom=Side(style='double', color=BROWN_DARK)
    )
    
    align_center = Alignment(horizontal='center', vertical='center', wrap_text=True)
    align_left = Alignment(horizontal='left', vertical='center')
    align_right = Alignment(horizontal='right', vertical='center')

    # Datos oficiales de los 18 productos producidos en Panadería Svetlana
    products = [
        {"id": 54, "name": "Pan Francés Tradicional", "cat": "Pan", "price": 0.50, "tray": 36},
        {"id": 55, "name": "Pan Dulce Pequeño", "cat": "Pan Dulce", "price": 0.50, "tray": 40},
        {"id": 56, "name": "Pan Dulce Grande", "cat": "Pan Dulce", "price": 1.25, "tray": 20},
        {"id": 57, "name": "Pan Galleta", "cat": "Galletas", "price": 1.25, "tray": 20},
        {"id": 58, "name": "Champurrada Pequeña", "cat": "Galletas", "price": 0.50, "tray": 24},
        {"id": 59, "name": "Champurrada Grande", "cat": "Galletas", "price": 1.25, "tray": 15},
        {"id": 60, "name": "Cubilete de Vainilla", "cat": "Reposteria", "price": 2.00, "tray": 30},
        {"id": 61, "name": "Cubilete de Banano", "cat": "Reposteria", "price": 2.00, "tray": 30},
        {"id": 62, "name": "Empanada de Piña", "cat": "Reposteria", "price": 2.50, "tray": 16},
        {"id": 63, "name": "Empanada de Manjar", "cat": "Reposteria", "price": 2.50, "tray": 16},
        {"id": 64, "name": "Polvorosa Tradicional", "cat": "Galletas", "price": 1.25, "tray": 15},
        {"id": 65, "name": "Dona Simple Glaseada", "cat": "Donas", "price": 2.50, "tray": 24},
        {"id": 66, "name": "Dona Rellena de Manjar", "cat": "Donas", "price": 4.00, "tray": 24},
        {"id": 67, "name": "Dona Rellena de Fresa", "cat": "Donas", "price": 4.00, "tray": 24},
        {"id": 68, "name": "Campechana", "cat": "Pan Dulce", "price": 1.25, "tray": 20},
        {"id": 69, "name": "Pasitas", "cat": "Pan Dulce", "price": 0.75, "tray": 30},
        {"id": 70, "name": "Cortada de Fresa", "cat": "Reposteria", "price": 2.50, "tray": 14},
        {"id": 71, "name": "Cortada de Chocolate", "cat": "Reposteria", "price": 2.50, "tray": 14},
    ]

    # Días de Septiembre 2026 (1 al 30)
    day_names_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    september_days = []
    for day in range(1, 31):
        dt = datetime.date(2026, 9, day)
        day_str = day_names_es[dt.weekday()]
        september_days.append({
            "date": dt,
            "date_str": dt.strftime("%d/%m/%Y"),
            "day_name": day_str,
            "is_sunday": dt.weekday() == 6
        })

    # =============================================================
    # HOJA 1: GUÍA E INSTRUCCIONES
    # =============================================================
    ws_info = wb.active
    ws_info.title = "Guía_y_Explicación"
    ws_info.views.sheetView[0].showGridLines = True
    
    ws_info.merge_cells("B2:J2")
    ws_info["B2"] = "📊 REGISTRO DE PRODUCCIÓN Y SOBRANTES — SEPTIEMBRE 2026"
    ws_info["B2"].font = f_sheet_title
    
    ws_info.merge_cells("B3:J3")
    ws_info["B3"] = "Panadería Svetlana — Documento de recolección de datos históricos para inicializar el sistema de inventario y cierres."
    ws_info["B3"].font = f_subtitle
    
    guide_sections = [
        ("1. Objetivo del Documento",
         "Este archivo permite recopilar lo que se horneó y lo que sobró cada día durante el mes de Septiembre 2026.\n"
         "Con estos datos, el sistema no empezará en cero: cargará el historial real de producción, el inventario inicial exacto para Octubre, y las estadísticas de venta y mermas por producto."),
        
        ("2. Estructura de las Hojas",
         "• Pestaña 'Matriz_Diaria_Septiembre': Es una cuadrícula del 1 al 30 de Septiembre. Cada fila es un día y contiene columnas de [Horneado] y [Sobrante] para cada pan. Ideal para revisar el mes completo de un solo vistazo.\n"
         "• Pestaña 'Carga_Detallada_Dia_a_Dia': Es la tabla estructurada fila por fila (Día x Pan). Incluye fórmulas automáticas para calcular: Venta en Piezas = Horneado - Sobrante, y el Total en Quetzales (Q).\n"
         "• Pestaña 'Resumen_Consolidado_Mes': Calcula automáticamente los totales de todo el mes por pan: Total Horneado, Total Sobrante, Total Vendido, % de Efectividad y Quetzales generados."),
        
        ("3. Glosario de Términos",
         "• Horneado (Piezas): Total de panes producidos en el día (puedes anotar directamente las piezas o multiplicar latas × unidades por lata).\n"
         "• Sobrante (Cierre): Panes que quedaron en vitrinas o canastas al final del día sin venderse.\n"
         "• Vendido = Horneado - Sobrante - Mermas (Se calcula automáticamente con fórmulas de Excel).\n"
         "• Venta Estimada (Q): Se multiplica las unidades vendidas por el precio oficial en Quetzales."),
         
        ("4. ¿Cómo entregarlo?",
         "Los dueños pueden rellenar los días de Septiembre según sus cuadernos o bitácoras de panadería. Si un día no se horneó algún producto (por ejemplo, donas los domingos), simplemente se coloca 0.")
    ]
    
    r_idx = 5
    for title, text in guide_sections:
        ws_info.cell(row=r_idx, column=2, value=title).font = f_section
        r_idx += 1
        
        lines_count = text.count('\n') + 1
        cell_text = ws_info.cell(row=r_idx, column=2, value=text)
        cell_text.font = f_data
        cell_text.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
        ws_info.merge_cells(start_row=r_idx, start_column=2, end_row=r_idx + lines_count, end_column=10)
        r_idx += lines_count + 2

    ws_info.column_dimensions['A'].width = 3
    ws_info.column_dimensions['B'].width = 25
    for col_l in ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']:
        ws_info.column_dimensions[col_l].width = 14

    # =============================================================
    # HOJA 2: MATRIZ DIARIA DE SEPTIEMBRE (Vista Calendario)
    # =============================================================
    ws_mat = wb.create_sheet(title="Matriz_Diaria_Septiembre")
    ws_mat.views.sheetView[0].showGridLines = True
    
    # Título
    ws_mat.merge_cells("A1:AL1")
    ws_mat["A1"] = "PANADERÍA SVETLANA — MATRIZ MENSUAL DE HORNEADO Y SOBRANTES (SEPTIEMBRE 2026)"
    ws_mat["A1"].font = f_title
    ws_mat["A1"].fill = fill_header
    ws_mat["A1"].alignment = align_center
    ws_mat.row_dimensions[1].height = 32
    
    # Fila 2: Encabezados superiores agrupados
    ws_mat.merge_cells("A2:C2")
    ws_mat["A2"] = "DATOS DEL DÍA"
    ws_mat["A2"].font = f_header
    ws_mat["A2"].fill = fill_sub_header
    ws_mat["A2"].alignment = align_center
    ws_mat["A2"].border = border_thin
    
    # 8 Panes Principales en la Matriz Rápida + Resumen de Totales
    key_products = [
        {"name": "Pan Francés (Q0.50)", "short": "Francés", "tray": 36},
        {"name": "Pan Dulce Pequeño (Q0.50)", "short": "P. D. Pequeño", "tray": 40},
        {"name": "Pan Dulce Grande (Q1.25)", "short": "P. D. Grande", "tray": 20},
        {"name": "Champurrada Grande (Q1.25)", "short": "Champurrada Gr.", "tray": 15},
        {"name": "Champurrada Pequeña (Q0.50)", "short": "Champurrada Pq.", "tray": 24},
        {"name": "Cubiletes (Q2.00)", "short": "Cubiletes", "tray": 30},
        {"name": "Empanadas (Q2.50)", "short": "Empanadas", "tray": 16},
        {"name": "Donas Variadas (Q2.50)", "short": "Donas", "tray": 24},
        {"name": "Otros Panes Dulces / Galletas", "short": "Otros Panes", "tray": 20},
    ]
    
    curr_c = 4
    for kp in key_products:
        start_c = curr_c
        end_c = curr_c + 2
        start_l = get_column_letter(start_c)
        end_l = get_column_letter(end_c)
        ws_mat.merge_cells(f"{start_l}2:{end_l}2")
        ws_mat[f"{start_l}2"] = kp["name"]
        ws_mat[f"{start_l}2"].font = f_header
        ws_mat[f"{start_l}2"].fill = fill_sub_header
        ws_mat[f"{start_l}2"].alignment = align_center
        ws_mat[f"{start_l}2"].border = border_thin
        curr_c += 3
        
    # Totales del día
    tot_start_c = curr_c
    tot_end_c = curr_c + 3
    ws_mat.merge_cells(f"{get_column_letter(tot_start_c)}2:{get_column_letter(tot_end_c)}2")
    ws_mat[f"{get_column_letter(tot_start_c)}2"] = "TOTALES DIARIOS CONSOLIDADOS"
    ws_mat[f"{get_column_letter(tot_start_c)}2"].font = f_header
    ws_mat[f"{get_column_letter(tot_start_c)}2"].fill = fill_amber_header
    ws_mat[f"{get_column_letter(tot_start_c)}2"].alignment = align_center
    ws_mat[f"{get_column_letter(tot_start_c)}2"].border = border_thin
    
    # Fila 3: Subencabezados por columna
    ws_mat.row_dimensions[3].height = 24
    sub_headers_mat = ["Fecha", "Día", "Sucursal"]
    ws_mat.column_dimensions['A'].width = 11
    ws_mat.column_dimensions['B'].width = 11
    ws_mat.column_dimensions['C'].width = 15
    
    for i, sh in enumerate(sub_headers_mat, start=1):
        c = ws_mat.cell(row=3, column=i, value=sh)
        c.font = f_header_sub
        c.fill = fill_sub_header
        c.alignment = align_center
        c.border = border_thin
        
    c_idx = 4
    for _ in key_products:
        for subh, color in [("Horneado", fill_sub_header), ("Sobrante", fill_amber_header), ("Vendido", fill_sub_header)]:
            c = ws_mat.cell(row=3, column=c_idx, value=subh)
            c.font = f_header_sub
            c.fill = color
            c.alignment = align_center
            c.border = border_thin
            col_letter = get_column_letter(c_idx)
            ws_mat.column_dimensions[col_letter].width = 10
            c_idx += 1
            
    # Subencabezados de totales
    for subh in ["Total Horneado", "Total Sobrante", "Total Vendido", "Venta Total (Q)"]:
        c = ws_mat.cell(row=3, column=c_idx, value=subh)
        c.font = f_header_sub
        c.fill = fill_amber_header
        c.alignment = align_center
        c.border = border_thin
        col_letter = get_column_letter(c_idx)
        ws_mat.column_dimensions[col_letter].width = 13
        c_idx += 1

    # Rellenar los 30 días de Septiembre en la Matriz
    for row_num, day_info in enumerate(september_days, start=4):
        ws_mat.row_dimensions[row_num].height = 20
        is_sun = day_info["is_sunday"]
        row_fill = fill_cream if is_sun else (fill_zebra if row_num % 2 == 0 else PatternFill(fill_type=None))
        
        # Fecha, Día, Sucursal
        c_f = ws_mat.cell(row=row_num, column=1, value=day_info["date_str"])
        c_f.alignment = align_center
        c_f.font = f_data_bold if is_sun else f_data
        c_f.border = border_thin
        c_f.fill = row_fill
        
        c_d = ws_mat.cell(row=row_num, column=2, value=day_info["day_name"])
        c_d.alignment = align_center
        c_d.font = f_data_bold if is_sun else f_data
        c_d.border = border_thin
        c_d.fill = row_fill
        
        c_s = ws_mat.cell(row=row_num, column=3, value="Central")
        c_s.alignment = align_center
        c_s.font = f_hint
        c_s.border = border_thin
        c_s.fill = row_fill
        
        # Columnas para cada producto
        col_p = 4
        baked_col_letters = []
        surplus_col_letters = []
        sold_col_letters = []
        
        for k_idx, kp in enumerate(key_products):
            let_horn = get_column_letter(col_p)
            let_sobr = get_column_letter(col_p + 1)
            let_vend = get_column_letter(col_p + 2)
            
            baked_col_letters.append(let_horn)
            surplus_col_letters.append(let_sobr)
            sold_col_letters.append(let_vend)
            
            # Celda Horneado
            c_horn = ws_mat.cell(row=row_num, column=col_p)
            c_horn.alignment = align_center
            c_horn.font = f_data
            c_horn.border = border_thin
            c_horn.fill = row_fill
            c_horn.number_format = '#,##0'
            
            # Celda Sobrante
            c_sobr = ws_mat.cell(row=row_num, column=col_p + 1)
            c_sobr.alignment = align_center
            c_sobr.font = Font(name=font_family, size=9, color=AMBER_TEXT)
            c_sobr.border = border_thin
            c_sobr.fill = fill_amber if not is_sun else row_fill
            c_sobr.number_format = '#,##0'
            
            # Celda Vendido (Fórmula: Horneado - Sobrante)
            c_vend = ws_mat.cell(row=row_num, column=col_p + 2, value=f"=MAX(0, {let_horn}{row_num}-{let_sobr}{row_num})")
            c_vend.alignment = align_center
            c_vend.font = Font(name=font_family, size=9, bold=True, color=GREEN_TEXT)
            c_vend.border = border_thin
            c_vend.fill = fill_green if not is_sun else row_fill
            c_vend.number_format = '#,##0'
            
            # Ejemplo ilustrativo para el primer día (01/09/2026)
            if row_num == 4:
                sample_bakes = [1188, 600, 300, 150, 240, 120, 96, 120, 200]
                sample_surplus = [36, 25, 12, 8, 15, 6, 4, 8, 10]
                c_horn.value = sample_bakes[k_idx]
                c_sobr.value = sample_surplus[k_idx]
                
            col_p += 3
            
        # Totales diarios
        # 1. Total Horneado: Suma de todas las columnas de horneado
        horn_formula = "+" + "+".join([f"{l}{row_num}" for l in baked_col_letters])
        c_th = ws_mat.cell(row=row_num, column=col_p, value=f"={horn_formula[1:]}")
        c_th.alignment = align_center
        c_th.font = f_data_bold
        c_th.border = border_thin
        c_th.fill = fill_cream
        c_th.number_format = '#,##0'
        
        # 2. Total Sobrante: Suma de columnas de sobrante
        sobr_formula = "+" + "+".join([f"{l}{row_num}" for l in surplus_col_letters])
        c_ts = ws_mat.cell(row=row_num, column=col_p + 1, value=f"={sobr_formula[1:]}")
        c_ts.alignment = align_center
        c_ts.font = Font(name=font_family, size=9, bold=True, color=AMBER_TEXT)
        c_ts.border = border_thin
        c_ts.fill = fill_amber
        c_ts.number_format = '#,##0'
        
        # 3. Total Vendido: Suma de columnas vendidas
        vend_formula = "+" + "+".join([f"{l}{row_num}" for l in sold_col_letters])
        c_tv = ws_mat.cell(row=row_num, column=col_p + 2, value=f"={vend_formula[1:]}")
        c_tv.alignment = align_center
        c_tv.font = Font(name=font_family, size=9, bold=True, color=GREEN_TEXT)
        c_tv.border = border_thin
        c_tv.fill = fill_green
        c_tv.number_format = '#,##0'
        
        # 4. Venta Estimada Q: Sumaproducto aproximada
        # (Francés*0.5 + PDPequeño*0.5 + PDGrande*1.25 + ChGr*1.25 + ChPq*0.5 + Cub*2.0 + Emp*2.5 + Don*2.5 + Ot*1.5)
        prices_mult = [0.5, 0.5, 1.25, 1.25, 0.5, 2.0, 2.5, 2.5, 1.5]
        q_calc_parts = [f"({sold_col_letters[i]}{row_num}*{prices_mult[i]})" for i in range(len(prices_mult))]
        c_tq = ws_mat.cell(row=row_num, column=col_p + 3, value=f"={' + '.join(q_calc_parts)}")
        c_tq.alignment = align_right
        c_tq.font = Font(name=font_family, size=9, bold=True, color=BROWN_DARK)
        c_tq.border = border_thin
        c_tq.fill = fill_cream
        c_tq.number_format = 'Q #,##0.00'

    # Fila de Totales Mensuales (Fila 34)
    tot_row = 34
    ws_mat.row_dimensions[tot_row].height = 26
    c_tot_label = ws_mat.cell(row=tot_row, column=1, value="TOTAL MES:")
    c_tot_label.font = f_total_bold
    c_tot_label.alignment = align_center
    c_tot_label.border = border_total
    c_tot_label.fill = fill_amber_header
    ws_mat.merge_cells(f"A{tot_row}:C{tot_row}")
    
    for c_i in range(4, col_p + 4):
        let = get_column_letter(c_i)
        c_total = ws_mat.cell(row=tot_row, column=c_i, value=f"=SUM({let}4:{let}33)")
        c_total.font = f_total_bold
        c_total.border = border_total
        c_total.fill = fill_amber
        if c_i == col_p + 3:
            c_total.alignment = align_right
            c_total.number_format = 'Q #,##0.00'
        else:
            c_total.alignment = align_center
            c_total.number_format = '#,##0'

    ws_mat.freeze_panes = "D4"

    # =============================================================
    # HOJA 3: CARGA DETALLADA DÍA A DÍA (Para importación directa a BD)
    # =============================================================
    ws_det = wb.create_sheet(title="Carga_Detallada_Dia_a_Dia")
    ws_det.views.sheetView[0].showGridLines = True
    
    ws_det.merge_cells("A1:N1")
    ws_det["A1"] = "REGISTRO DIARIO DE HORNEADO, SOBRANTE Y MERMAS (BASE DE DATOS SEPTIEMBRE 2026)"
    ws_det["A1"].font = f_title
    ws_det["A1"].fill = fill_header
    ws_det["A1"].alignment = align_center
    ws_det.row_dimensions[1].height = 32
    
    det_headers = [
        ("Fecha", 11, align_center),
        ("Día Semana", 11, align_center),
        ("Sucursal", 14, align_center),
        ("ID Prod", 8, align_center),
        ("Categoría", 13, align_center),
        ("Producto Terminado", 25, align_left),
        ("Uds/Lata", 10, align_center),
        ("Latas Horneadas", 14, align_center),
        ("Total Horneado (Piezas)", 16, align_center),
        ("Sobrante al Cierre (Piezas)", 16, align_center),
        ("Merma / Dañados", 14, align_center),
        ("Venta Estimada (Piezas)", 16, align_center),
        ("Precio (Q)", 10, align_right),
        ("Total Venta (Q)", 15, align_right),
    ]
    
    ws_det.row_dimensions[2].height = 26
    for col_idx, (h_name, width, h_align) in enumerate(det_headers, start=1):
        c = ws_det.cell(row=2, column=col_idx, value=h_name)
        c.font = f_header
        c.fill = fill_sub_header
        c.alignment = align_center
        c.border = border_thin
        col_letter = get_column_letter(col_idx)
        ws_det.column_dimensions[col_letter].width = width

    # Poblamos con los primeros días y dejamos plantilla lista
    # Ejemplo con los primeros 3 días completos (54 filas con ejemplos listos) y espacio para el resto
    d_row = 3
    sample_bakes_daily = {
        54: (33, 1188, 36),  # Francés
        55: (15, 600, 25),   # PD Pequeño
        56: (15, 300, 15),   # PD Grande
        57: (10, 200, 10),   # Pan Galleta
        58: (10, 240, 12),   # Champurrada Pq
        59: (10, 150, 8),    # Champurrada Gr
        60: (4, 120, 6),     # Cubilete Vainilla
        61: (4, 120, 5),     # Cubilete Banano
        62: (6, 96, 4),      # Empanada Piña
        63: (6, 96, 4),      # Empanada Manjar
        64: (10, 150, 10),   # Polvorosa
        65: (5, 120, 8),     # Dona Glaseada
        66: (5, 120, 6),     # Dona Manjar
        67: (5, 120, 6),     # Dona Fresa
        68: (10, 200, 12),   # Campechana
        69: (8, 240, 15),    # Pasitas
        70: (6, 84, 4),      # Cortada Fresa
        71: (6, 84, 4),      # Cortada Chocolate
    }

    # Llenamos los días de Septiembre (1 al 30) para todos los 18 productos
    for d_idx, day_info in enumerate(september_days, start=1):
        for prod in products:
            ws_det.row_dimensions[d_row].height = 19
            is_sample_day = d_idx == 1  # Solo el primer día con valores de muestra
            
            # Fecha, Día, Sucursal
            ws_det.cell(row=d_row, column=1, value=day_info["date_str"]).alignment = align_center
            ws_det.cell(row=d_row, column=2, value=day_info["day_name"]).alignment = align_center
            ws_det.cell(row=d_row, column=3, value="Sucursal Central").alignment = align_center
            
            # ID, Cat, Producto, Uds/Lata
            ws_det.cell(row=d_row, column=4, value=prod["id"]).alignment = align_center
            ws_det.cell(row=d_row, column=5, value=prod["cat"]).alignment = align_center
            ws_det.cell(row=d_row, column=6, value=prod["name"]).alignment = align_left
            ws_det.cell(row=d_row, column=7, value=prod["tray"]).alignment = align_center
            
            # Latas Horneadas
            c_latas = ws_det.cell(row=d_row, column=8)
            c_latas.alignment = align_center
            c_latas.number_format = '#,##0'
            
            # Total Horneado en Piezas: Si hay latas, calcula Latas*Uds/Lata. Si no, permite escribir directo.
            c_horn = ws_det.cell(row=d_row, column=9)
            c_horn.alignment = align_center
            c_horn.number_format = '#,##0'
            
            # Sobrante
            c_sobr = ws_det.cell(row=d_row, column=10)
            c_sobr.alignment = align_center
            c_sobr.number_format = '#,##0'
            
            # Merma
            c_merma = ws_det.cell(row=d_row, column=11)
            c_merma.alignment = align_center
            c_merma.number_format = '#,##0'
            
            if is_sample_day and prod["id"] in sample_bakes_daily:
                s_lata, s_piezas, s_sobr = sample_bakes_daily[prod["id"]]
                c_latas.value = s_lata
                c_horn.value = f"=IF(H{d_row}>0, H{d_row}*G{d_row}, {s_piezas})"
                c_sobr.value = s_sobr
                c_merma.value = 0
            else:
                c_horn.value = f"=IF(H{d_row}>0, H{d_row}*G{d_row}, \"\")"
                c_merma.value = 0
                
            # Venta en Piezas: FÓRMULA: =MAX(0, Horneado - Sobrante - Merma)
            c_vent = ws_det.cell(row=d_row, column=12, value=f"=IF(I{d_row}>0, MAX(0, I{d_row}-J{d_row}-K{d_row}), 0)")
            c_vent.alignment = align_center
            c_vent.font = Font(name=font_family, size=9, bold=True, color=GREEN_TEXT)
            c_vent.number_format = '#,##0'
            
            # Precio
            c_pr = ws_det.cell(row=d_row, column=13, value=prod["price"])
            c_pr.alignment = align_right
            c_pr.number_format = 'Q #,##0.00'
            
            # Total Venta Q: FÓRMULA: =Venta_Piezas * Precio
            c_tot_q = ws_det.cell(row=d_row, column=14, value=f"=L{d_row}*M{d_row}")
            c_tot_q.alignment = align_right
            c_tot_q.font = Font(name=font_family, size=9, bold=True, color=BROWN_DARK)
            c_tot_q.number_format = 'Q #,##0.00'
            
            # Estilos de bordes y fondo
            row_fill = fill_cream if day_info["is_sunday"] else (fill_zebra if d_idx % 2 == 0 else PatternFill(fill_type=None))
            for ci in range(1, 15):
                cell_item = ws_det.cell(row=d_row, column=ci)
                cell_item.border = border_thin
                if not cell_item.font.color:
                    cell_item.font = f_data
                if row_fill.fill_type:
                    cell_item.fill = row_fill
                    
            d_row += 1

    ws_det.freeze_panes = "G3"

    # =============================================================
    # HOJA 4: RESUMEN CONSOLIDADO DEL MES
    # =============================================================
    ws_res = wb.create_sheet(title="Resumen_Consolidado_Mes")
    ws_res.views.sheetView[0].showGridLines = True
    
    ws_res.merge_cells("A1:I1")
    ws_res["A1"] = "RESUMEN CONSOLIDADO MENSUAL POR PRODUCTO — SEPTIEMBRE 2026"
    ws_res["A1"].font = f_title
    ws_res["A1"].fill = fill_header
    ws_res["A1"].alignment = align_center
    ws_res.row_dimensions[1].height = 32
    
    res_headers = [
        ("ID", 7, align_center),
        ("Categoría", 14, align_center),
        ("Producto", 26, align_left),
        ("Precio Base", 12, align_right),
        ("Total Horneado Mes", 18, align_center),
        ("Total Sobrante Mes", 18, align_center),
        ("Total Vendido Mes", 18, align_center),
        ("% Eficiencia Venta", 16, align_center),
        ("Ingreso Total Estimado (Q)", 24, align_right),
    ]
    
    ws_res.row_dimensions[2].height = 26
    for col_idx, (h_name, width, h_align) in enumerate(res_headers, start=1):
        c = ws_res.cell(row=2, column=col_idx, value=h_name)
        c.font = f_header
        c.fill = fill_sub_header
        c.alignment = align_center
        c.border = border_thin
        col_letter = get_column_letter(col_idx)
        ws_res.column_dimensions[col_letter].width = width

    last_det_row = d_row - 1
    for p_idx, prod in enumerate(products, start=3):
        ws_res.row_dimensions[p_idx].height = 22
        
        ws_res.cell(row=p_idx, column=1, value=prod["id"]).alignment = align_center
        ws_res.cell(row=p_idx, column=2, value=prod["cat"]).alignment = align_center
        ws_res.cell(row=p_idx, column=3, value=prod["name"]).alignment = align_left
        
        c_p = ws_res.cell(row=p_idx, column=4, value=prod["price"])
        c_p.alignment = align_right
        c_p.number_format = 'Q #,##0.00'
        
        # Fórmulas SUMIF desde la hoja de Carga_Detallada_Dia_a_Dia
        # Total Horneado: =SUMIF(Carga_Detallada_Dia_a_Dia!$D$3:$D$542, A3, Carga_Detallada_Dia_a_Dia!$I$3:$I$542)
        c_th = ws_res.cell(row=p_idx, column=5, value=f"=SUMIF(Carga_Detallada_Dia_a_Dia!$D$3:$D${last_det_row}, A{p_idx}, Carga_Detallada_Dia_a_Dia!$I$3:$I${last_det_row})")
        c_th.alignment = align_center
        c_th.font = f_data_bold
        c_th.number_format = '#,##0'
        
        # Total Sobrante: =SUMIF(..., J)
        c_ts = ws_res.cell(row=p_idx, column=6, value=f"=SUMIF(Carga_Detallada_Dia_a_Dia!$D$3:$D${last_det_row}, A{p_idx}, Carga_Detallada_Dia_a_Dia!$J$3:$J${last_det_row})")
        c_ts.alignment = align_center
        c_ts.font = Font(name=font_family, size=9, bold=True, color=AMBER_TEXT)
        c_ts.fill = fill_amber
        c_ts.number_format = '#,##0'
        
        # Total Vendido: =SUMIF(..., L)
        c_tv = ws_res.cell(row=p_idx, column=7, value=f"=SUMIF(Carga_Detallada_Dia_a_Dia!$D$3:$D${last_det_row}, A{p_idx}, Carga_Detallada_Dia_a_Dia!$L$3:$L${last_det_row})")
        c_tv.alignment = align_center
        c_tv.font = Font(name=font_family, size=9, bold=True, color=GREEN_TEXT)
        c_tv.fill = fill_green
        c_tv.number_format = '#,##0'
        
        # % Eficiencia: =IF(E>0, G/E, 0)
        c_ef = ws_res.cell(row=p_idx, column=8, value=f"=IF(E{p_idx}>0, G{p_idx}/E{p_idx}, 0)")
        c_ef.alignment = align_center
        c_ef.font = f_data_bold
        c_ef.number_format = '0.0%'
        
        # Ingreso Total: =G*D
        c_ing = ws_res.cell(row=p_idx, column=9, value=f"=G{p_idx}*D{p_idx}")
        c_ing.alignment = align_right
        c_ing.font = Font(name=font_family, size=9, bold=True, color=BROWN_DARK)
        c_ing.fill = fill_cream
        c_ing.number_format = 'Q #,##0.00'
        
        for ci in range(1, 10):
            cell_item = ws_res.cell(row=p_idx, column=ci)
            cell_item.border = border_thin
            if not cell_item.font.color:
                cell_item.font = f_data
            if p_idx % 2 == 0 and not cell_item.fill.fill_type:
                cell_item.fill = fill_zebra

    # Fila de Totales de la Panadería en el Mes
    res_tot_row = len(products) + 3
    ws_res.row_dimensions[res_tot_row].height = 26
    c_tot_res = ws_res.cell(row=res_tot_row, column=1, value="TOTAL GENERAL MES:")
    c_tot_res.font = f_total_bold
    c_tot_res.alignment = align_center
    c_tot_res.fill = fill_amber_header
    c_tot_res.border = border_total
    ws_res.merge_cells(f"A{res_tot_row}:D{res_tot_row}")
    
    ws_res.cell(row=res_tot_row, column=5, value=f"=SUM(E3:E{res_tot_row-1})").number_format = '#,##0'
    ws_res.cell(row=res_tot_row, column=6, value=f"=SUM(F3:F{res_tot_row-1})").number_format = '#,##0'
    ws_res.cell(row=res_tot_row, column=7, value=f"=SUM(G3:G{res_tot_row-1})").number_format = '#,##0'
    ws_res.cell(row=res_tot_row, column=8, value=f"=IF(E{res_tot_row}>0, G{res_tot_row}/E{res_tot_row}, 0)").number_format = '0.0%'
    ws_res.cell(row=res_tot_row, column=9, value=f"=SUM(I3:I{res_tot_row-1})").number_format = 'Q #,##0.00'
    
    for ci in range(5, 10):
        c_item = ws_res.cell(row=res_tot_row, column=ci)
        c_item.font = f_total_bold
        c_item.fill = fill_amber
        c_item.border = border_total
        if ci in [5, 6, 7, 8]:
            c_item.alignment = align_center
        else:
            c_item.alignment = align_right

    # Guardar en raíz del proyecto
    output_path = os.path.join(os.getcwd(), "REGISTRO_PRODUCCION_Y_SOBRANTES_SEPTIEMBRE_2026.xlsx")
    wb.save(output_path)
    print(f"Archivo Excel generado con éxito en: {output_path}")

if __name__ == "__main__":
    generate_september_excel()
