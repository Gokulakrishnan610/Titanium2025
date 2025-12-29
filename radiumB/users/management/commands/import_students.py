import csv
import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from authentication.models import UserProfile
from users.choices import DEPARTMENT_CHOICES, DEGREE_CHOICES

User = get_user_model()


class Command(BaseCommand):
    help = 'Import students from CSV file and generate passwords'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the CSV file containing student data'
        )
        parser.add_argument(
            '--output',
            type=str,
            default='student_credentials.csv',
            help='Output CSV file for credentials (default: student_credentials.csv)'
        )

    def handle(self, *args, **options):
        csv_file_path = options['csv_file']
        output_file = options['output']

        if not os.path.exists(csv_file_path):
            raise CommandError(f'CSV file "{csv_file_path}" does not exist.')

        dept_mapping = {
            'Computer Science & Engineering': 'CSE',
            'Computer Science & Design': 'CSD',
            'Computer Science & Business Systems': 'CSBS',
            'Information Technology': 'IT',
            'Electronics & Communication Engineering': 'ECE',
            'Electrical & Electronics Engineering': 'EEE',
            'Mechanical Engineering': 'MECH',
            'Civil Engineering': 'CIVIL',
            'Automobile Engineering': 'AUTO',
            'Biotechnology': 'BT',
            'Artificial Intelligence & Data Science': 'AIDS',
            'Artificial Intelligence & Machine Learning': 'AIML',
            'Computer Science & Engineering (Cyber Security)': 'CSECS',
            'Mechatronics Engineering': 'MECHATRONICS',
            'Aeronautical Engineering': 'AERO',
            'Biomedical Engineering': 'BME',
            'Chemical Engineering': 'CHEM',
            'Food Technology': 'FT',
            'Management Studies': 'MBA',
            'Robotics & Automation': 'RA',
        }

        credentials = []
        processed_count = 0
        created_count = 0
        updated_count = 0

        self.stdout.write(f'Processing CSV file: {csv_file_path}')

        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)

                for row in reader:
                    try:
                        email = row['student_id__email'].strip()
                        roll_no = row['roll_no'].strip()
                        first_name = row['student_id__first_name'].strip()
                        last_name = row['student_id__last_name'].strip()
                        department_name = row['dept_id__dept_name'].strip()
                        batch = row['batch'].strip()

                        if not all([email, roll_no, first_name]) or email is None or roll_no is None or first_name is None:
                            self.stdout.write(
                                self.style.WARNING(f'Skipping row with missing data: {row}')
                            )
                            continue

                        password = f"{first_name}${last_name}%{department_name}.{roll_no}"

                        department_code = dept_mapping.get(department_name, department_name)

                        degree = 'B.Tech' if batch else 'B.Tech'

                        current_year = 2025  # Current year
                        try:
                            batch_year = int(batch)
                            year_diff = current_year - batch_year
                            if year_diff == 0:
                                year = '2025'  # 1st year
                            elif year_diff == 1:
                                year = '2024'  # 2nd year
                            elif year_diff == 2:
                                year = '2023'  # 3rd year
                            elif year_diff == 3:
                                year = '2022'  # 4th year
                            else:
                                year = batch 
                        except (ValueError, TypeError):
                            year = batch or '2025'

                        with transaction.atomic():
                            user, user_created = User.objects.get_or_create(
                                email=email,
                                defaults={
                                    'username': email.split('@')[0],  
                                    'first_name': first_name,
                                    'last_name': last_name,
                                }
                            )

                            if not user_created:
                                user.first_name = first_name
                                user.last_name = last_name
                                user.save()
                                updated_count += 1
                            else:
                                created_count += 1

                            user.set_password(password)
                            user.save()

                            profile, profile_created = UserProfile.objects.get_or_create(
                                user=user,
                                defaults={
                                    'display_name': f"{first_name} {last_name}".strip(),
                                    'gender': '',  
                                    'degree': degree,
                                    'year': year,
                                    'department': department_code,
                                    'rollno': roll_no,
                                    'phone_number': '',  
                                    'college_name': 'Rajalakshmi Engineering College',
                                    'is_verified': True,  
                                }
                            )

                            if not profile_created:
                                profile.display_name = f"{first_name} {last_name}".strip()
                                profile.degree = degree
                                profile.year = year
                                profile.department = department_code
                                profile.rollno = roll_no
                                profile.is_verified = True
                                profile.save()

                            credentials.append({
                                'email': email,
                                'password': password,  
                                'first_name': first_name,
                                'last_name': last_name,
                                'roll_no': roll_no,
                                'department': department_name,
                                'batch': batch
                            })

                            processed_count += 1

                            if processed_count % 100 == 0:
                                self.stdout.write(f'Processed {processed_count} students...')

                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Error processing row {row}: {str(e)}')
                        )
                        continue

        except Exception as e:
            raise CommandError(f'Error reading CSV file: {str(e)}')

        if credentials:
            try:
                with open(output_file, 'w', newline='', encoding='utf-8') as file:
                    fieldnames = ['email', 'password', 'first_name', 'last_name', 'roll_no', 'department', 'batch']
                    writer = csv.DictWriter(file, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(credentials)

                self.stdout.write(
                    self.style.SUCCESS(f'Successfully exported credentials to {output_file}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error writing credentials CSV: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Import completed!\n'
                f'Total processed: {processed_count}\n'
                f'Created: {created_count}\n'
                f'Updated: {updated_count}'
            )
        )