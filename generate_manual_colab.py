# Google Colab / Python Script to Generate Skill Tracker PDF Manual
# Before running this in Google Colab, make sure to:
# 1. Upload `hero_section.png` and `highlights_section.png` to your Colab workspace
# 2. Run: !pip install fpdf2

from fpdf import FPDF
import os

class ManualPDF(FPDF):
    def header(self):
        # Arial bold 15
        self.set_font('Helvetica', 'B', 15)
        # Title
        self.cell(0, 10, 'Skill Tracker: Official User Guide', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('Helvetica', 'I', 8)
        # Text
        self.cell(0, 10, 'developed by Sudheendra Sripada - Page ' + str(self.page_no()), 0, 0, 'C')

def create_pdf():
    pdf = ManualPDF()
    pdf.add_page()
    
    # Title Section
    pdf.set_font("Helvetica", style="B", size=24)
    pdf.cell(0, 20, "Skill Tracker", ln=True, align='C')
    pdf.set_font("Helvetica", size=12)
    pdf.multi_cell(0, 10, "Welcome to Skill Tracker! Your ultimate learning command center designed to help you plan, practice, and prove mastery across any topic. This guide will walk you through from the absolute basics to utilizing advanced interactive AI.")
    pdf.ln(10)
    
    # Hero Image
    if os.path.exists("hero_section.png"):
        pdf.image("hero_section.png", x=10, w=190)
        pdf.ln(5)
    
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 10, "1. Getting Started", ln=True)
    pdf.set_font("Helvetica", size=12)
    pdf.multi_cell(0, 10, "To start tracking your progress, you'll need an account.\n- Navigate to the landing page.\n- Click the 'Launch Skill Tracker' button (highlighted in Green).\n- Sign up using your email and a secure password. Your session securely tracks your daily Check-ins and Streaks!")
    pdf.ln(10)
    
    # Highlights Image
    if os.path.exists("highlights_section.png"):
        pdf.image("highlights_section.png", x=10, w=190)
        pdf.ln(5)
    
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 10, "2. Building Your Learning Track", ln=True)
    pdf.set_font("Helvetica", size=12)
    pdf.multi_cell(0, 10, "Skill Tracker isn't just a list - it's a structured path.\n- Once inside the app dashboard, locate the input bar.\n- Type in whatever you want to learn (e.g., 'Machine Learning Basics').\n- Click Generate Path.\n\nThe system will automatically organize your topic into structured milestones and break those down into manageable subtopics. Each subtopic contains curated online resources, such as videos and articles.")
    pdf.ln(10)
    
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 10, "3. Interactive Document Learning (Pro)", ln=True)
    pdf.set_font("Helvetica", size=12)
    pdf.multi_cell(0, 10, "Rather than just reading passive text, you can upload your own study materials and talk to them!\n- Navigate to your selected Topic workspace.\n- Click '+ Upload PDF' and select your standard PDF.\n- Interactive Studio: The Left Side shows a clean PDF viewer, while the Right Side acts as your AI Tutor Chat.\n- Generate Practice Quizzes directly from your uploaded documents to test your mastery!")
    pdf.ln(15)

    # Clickable link button simulation
    pdf.set_font("Helvetica", style="B", size=14)
    pdf.set_text_color(0, 102, 204) # Blue link color
    pdf.cell(0, 10, "Experience Now ->", ln=True, align='C', link="http://localhost:3000/")
    pdf.set_text_color(0, 0, 0) # Reset color
    
    pdf.ln(20)
    pdf.set_font("Helvetica", style="I", size=12)
    pdf.multi_cell(0, 10, "developed by\nSudheendra Sripada", align='C')

    pdf.output("Skill_Tracker_User_Manual.pdf")
    print("Successfully generated Skill_Tracker_User_Manual.pdf!")

if __name__ == "__main__":
    create_pdf()
