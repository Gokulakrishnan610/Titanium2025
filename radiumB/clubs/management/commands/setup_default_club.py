from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from clubs.models import Club, ClubMembership, ClubSettings

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a default club and migrate existing system to multi-club setup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--club-name',
            type=str,
            default='DEVS REC',
            help='Name of the default club'
        )
        parser.add_argument(
            '--club-email',
            type=str,
            default='devs@rajalakshmi.edu.in',
            help='Email of the default club'
        )
        parser.add_argument(
            '--admin-username',
            type=str,
            help='Username of the admin user to add to the club'
        )

    def handle(self, *args, **options):
        club_name = options['club_name']
        club_email = options['club_email']
        admin_username = options.get('admin_username')

        # Create or get the default club
        club, created = Club.objects.get_or_create(
            name=club_name,
            defaults={
                'slug': club_name.lower().replace(' ', '-'),
                'description': f'Default club for {club_name} event management system',
                'club_type': 'technical',
                'email': club_email,
                'status': 'active',
                'is_default': True,
                'allow_public_events': True,
                'payment_gateway': 'cashfree'
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created default club: {club_name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Club "{club_name}" already exists')
            )

        # Create club settings
        settings, settings_created = ClubSettings.objects.get_or_create(
            club=club,
            defaults={
                'email_signature': f'Best regards,\n{club_name} Team',
                'default_event_duration': 120,
                'auto_approve_events': True,
                'default_registration_deadline_days': 1,
                'allow_late_registration': False,
                'default_currency': 'INR'
            }
        )

        if settings_created:
            self.stdout.write(
                self.style.SUCCESS('Successfully created club settings')
            )

        # Add admin user if specified
        if admin_username:
            try:
                admin_user = User.objects.get(username=admin_username)
                membership, membership_created = ClubMembership.objects.get_or_create(
                    club=club,
                    user=admin_user,
                    defaults={
                        'role': 'admin',
                        'status': 'active',
                        'can_create_events': True,
                        'can_manage_members': True,
                        'can_manage_payments': True,
                        'can_view_analytics': True
                    }
                )

                if membership_created:
                    self.stdout.write(
                        self.style.SUCCESS(f'Added {admin_username} as club admin')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'{admin_username} is already a member of the club')
                    )

            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User "{admin_username}" not found')
                )

        # Update existing events to belong to the default club
        from event.models import Event
        events_updated = Event.objects.filter(club__isnull=True).update(club=club)
        
        if events_updated > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Updated {events_updated} existing events to belong to {club_name}')
            )

        self.stdout.write(
            self.style.SUCCESS('Multi-club setup completed successfully!')
        )