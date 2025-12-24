from django.core.management.base import BaseCommand
from authentication.models import UserProfile


class Command(BaseCommand):
    help = 'Update user years based on roll number patterns (25->1st, 24->2nd, 23->3rd, 22->4th)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Update year even if already set',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        # Get all user profiles with roll numbers
        profiles = UserProfile.objects.exclude(rollno='')
        
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        self.stdout.write(f"Processing {profiles.count()} user profiles...")
        
        for profile in profiles:
            try:
                # Skip if year is already set and not forcing
                if profile.year and not force:
                    skipped_count += 1
                    continue
                
                # Get year from roll number
                detected_year = profile.get_year_from_rollno()
                
                if detected_year:
                    old_year = profile.year or 'None'
                    
                    if dry_run:
                        self.stdout.write(
                            f"Would update {profile.user.username} (Roll: {profile.rollno}): "
                            f"{old_year} -> {detected_year}"
                        )
                    else:
                        profile.year = detected_year
                        profile.save()
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Updated {profile.user.username} (Roll: {profile.rollno}): "
                                f"{old_year} -> {detected_year}"
                            )
                        )
                    updated_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Could not determine year for {profile.user.username} "
                            f"(Roll: {profile.rollno})"
                        )
                    )
                    skipped_count += 1
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"Error processing {profile.user.username}: {str(e)}"
                    )
                )
        
        # Summary
        self.stdout.write("\n" + "="*50)
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"DRY RUN COMPLETE"))
            self.stdout.write(f"Would update: {updated_count} profiles")
        else:
            self.stdout.write(self.style.SUCCESS(f"UPDATE COMPLETE"))
            self.stdout.write(f"Updated: {updated_count} profiles")
        
        self.stdout.write(f"Skipped: {skipped_count} profiles")
        self.stdout.write(f"Errors: {error_count} profiles")
        
        if dry_run and updated_count > 0:
            self.stdout.write("\nRun without --dry-run to apply changes")