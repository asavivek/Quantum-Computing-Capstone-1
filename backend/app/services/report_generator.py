import os
import io
from typing import Dict, Any
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_prediction_pdf(prediction: Dict[str, Any]) -> io.BytesIO:
    """
    Generates a high-quality PDF report for an individual agricultural yield prediction
    using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1b4332')
    )
    
    subhead_style = ParagraphStyle(
        'DocSubhead',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4a5568')
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2d3748'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#2d3748')
    )

    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#718096')
    )

    story = []

    # Title & Branding
    story.append(Paragraph("QuantumYield AI — Precision Yield & Quantum ML Report", header_style))
    story.append(Paragraph("Capstone Research: Quantum AI-Based Crop Yield Prediction & Smart Farming Platform", subhead_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1b4332'), spaceAfter=10))

    # Metadata Bar
    pred_id = prediction.get('id', 'N/A')
    created_at = prediction.get('created_at', datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"))
    crop = prediction.get('crop', 'N/A')
    region = prediction.get('region', 'N/A')
    season = prediction.get('season', 'N/A')
    area = prediction.get('area_hectares', 'N/A')

    meta_data = [
        [
            Paragraph(f"<b>Report ID:</b> {pred_id[:16]}...", body_style),
            Paragraph(f"<b>Timestamp:</b> {created_at}", body_style),
            Paragraph(f"<b>Target Crop:</b> {crop}", body_style)
        ],
        [
            Paragraph(f"<b>Region:</b> {region}", body_style),
            Paragraph(f"<b>Season:</b> {season}", body_style),
            Paragraph(f"<b>Field Area:</b> {area} ha", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[2.3*inch, 2.6*inch, 2.3*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#bbf7d0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dcfce7')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Yield Prediction Highlights Card
    pred_yield = prediction.get('predicted_yield', 0.0)
    conf_low = prediction.get('confidence_lower', pred_yield * 0.85)
    conf_high = prediction.get('confidence_upper', pred_yield * 1.15)
    unit = prediction.get('unit', 't/ha')
    selected_model = prediction.get('selected_model', 'HistGradientBoosting')
    total_yield = round(float(pred_yield) * float(area if area != 'N/A' else 1.0), 2)

    yield_card = [
        [
            Paragraph(f"<b>PREDICTED YIELD PER HECTARE:</b><br/><font size=16 color='#1b4332'><b>{pred_yield} {unit}</b></font>", body_style),
            Paragraph(f"<b>90% PREDICTION INTERVAL:</b><br/><font size=12 color='#2d3748'><b>[{conf_low} — {conf_high}] {unit}</b></font>", body_style),
            Paragraph(f"<b>TOTAL FARM PRODUCTION:</b><br/><font size=14 color='#166534'><b>{total_yield} metric tons</b></font>", body_style)
        ]
    ]
    yield_table = Table(yield_card, colWidths=[2.5*inch, 2.4*inch, 2.3*inch])
    yield_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e6f4ea')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#2e7d32')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(yield_table)
    story.append(Spacer(1, 10))

    # Input Parameters Table
    story.append(Paragraph("1. Field Agronomic & Environmental Inputs", section_style))
    inputs = prediction.get('inputs', {})
    input_rows = [
        ['Soil Property', 'Value', 'Weather Parameter', 'Value'],
        ['Soil pH', str(inputs.get('soil_ph', 'N/A')), 'Average Temperature', f"{inputs.get('temperature', 'N/A')} °C"],
        ['Nitrogen (N)', f"{inputs.get('soil_nitrogen', 'N/A')} kg/ha", 'Cumulative Rainfall', f"{inputs.get('rainfall', 'N/A')} mm"],
        ['Phosphorus (P)', f"{inputs.get('soil_phosphorus', 'N/A')} kg/ha", 'Relative Humidity', f"{inputs.get('humidity', 'N/A')} %"],
        ['Potassium (K)', f"{inputs.get('soil_potassium', 'N/A')} kg/ha", 'Soil Moisture', f"{inputs.get('soil_moisture', 'N/A')} %"],
        ['Organic Carbon (SOC)', f"{inputs.get('soil_organic_carbon', 'N/A')} %", 'Soil Texture Class', str(inputs.get('soil_type', 'N/A'))]
    ]
    input_table = Table(input_rows, colWidths=[1.8*inch, 1.8*inch, 1.8*inch, 1.8*inch])
    input_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(input_table)
    story.append(Spacer(1, 10))

    # Model Evaluation Comparison Table
    story.append(Paragraph("2. Multi-Model Benchmark Comparison (Identical Split Evaluation)", section_style))
    model_results = prediction.get('model_results', [])
    if model_results:
        m_rows = [['Model Name', 'Architecture', 'Estimated Yield', 'MAE', 'RMSE', 'R²', 'Latency']]
        for m in model_results:
            is_sel = "(Selected)" if m.get('model_key') == selected_model else ""
            m_rows.append([
                f"{m.get('model_name', '')} {is_sel}",
                m.get('model_type', ''),
                f"{m.get('predicted_yield', '')} t/ha",
                str(m.get('mae', '')),
                str(m.get('rmse', '')),
                str(m.get('r2', '')),
                f"{m.get('latency_ms', '')} ms"
            ])
        m_table = Table(m_rows, colWidths=[2.2*inch, 1.5*inch, 1.0*inch, 0.6*inch, 0.6*inch, 0.6*inch, 0.7*inch])
        m_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(m_table)
        story.append(Spacer(1, 10))

    # Quantum Metadata Section
    q_meta = prediction.get('quantum_metadata', {})
    if q_meta:
        story.append(Paragraph("3. Quantum Machine Learning Execution Metadata", section_style))
        q_rows = [
            ['Quantum Parameter', 'Specification', 'Quantum Parameter', 'Specification'],
            ['Quantum Circuit', f"{q_meta.get('qubits', 4)} Qubits", 'Feature Map', str(q_meta.get('feature_map', 'ZZFeatureMap'))],
            ['Circuit Repetitions', str(q_meta.get('reps', 2)), 'Entanglement Layout', str(q_meta.get('entanglement', 'linear'))],
            ['Simulation Backend', str(q_meta.get('simulator_engine', 'Qiskit Aer / Statevector')), 'Kernel Latency', f"{q_meta.get('quantum_inference_time_ms', 'N/A')} ms"]
        ]
        q_table = Table(q_rows, colWidths=[1.8*inch, 1.8*inch, 1.8*inch, 1.8*inch])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        story.append(q_table)
        story.append(Spacer(1, 10))

    # Agronomic Recommendations
    ag_insights = prediction.get('agronomic_insights', {})
    recs = ag_insights.get('recommendations', [])
    if recs:
        story.append(Paragraph("4. Data-Driven Agronomic Guidance & Field Actions", section_style))
        r_rows = [['Category', 'Observation', 'Recommended Management Action']]
        for r in recs[:4]:  # Top 4 recommendations to fit neatly
            r_rows.append([
                Paragraph(f"<b>{r.get('category', '')}</b>", body_style),
                Paragraph(r.get('observation', ''), body_style),
                Paragraph(r.get('action', ''), body_style)
            ])
        r_table = Table(r_rows, colWidths=[1.8*inch, 2.7*inch, 2.7*inch])
        r_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(r_table)
        story.append(Spacer(1, 10))

    # Disclaimers & Integrity Note
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#cbd5e1'), spaceBefore=8, spaceAfter=6))
    disclaimer_text = (
        "<b>Scientific Integrity & Capstone Disclaimer:</b> QuantumYield AI evaluates genuine quantum circuit simulation "
        "using Qiskit Aer against classical benchmarks. Yield predictions are algorithmic estimates based on input sensor data "
        "and empirical models, not biological guarantees. Agricultural management actions follow FAO and ICAR agronomic thresholds."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
