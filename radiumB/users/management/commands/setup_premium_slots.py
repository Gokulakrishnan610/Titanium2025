from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.membership_models import PremiumMembershipSlot


class Command(BaseCommand):
    help = 'Create sample premium membership slots for testing'

    def handle(self, *args, **options):
        # Create sample premium slots
        slots_data = [
            {
                'name': 'Batch 1 - November 2025',
                'description': 'First premium membership batch for advanced developers. Limited to 20 slots with exclusive mentorship and project opportunities.',
                'total_slots': 20,
                'is_open': True,
                'opens_at': timezone.now() - timedelta(days=1),
                'closes_at': timezone.now() + timedelta(days=30),
            },
            {
                'name': 'Batch 2 - December 2025',
                'description': 'Second premium membership batch focusing on industry partnerships and internship opportunities.',
                'total_slots': 15,
                'is_open': True,
                'opens_at': timezone.now() + timedelta(days=15),
                'closes_at': timezone.now() + timedelta(days=45),
            },
            {
                'name': 'Batch 3 - January 2026',
                'description': 'Third premium membership batch with focus on startup incubation and entrepreneurship.',
                'total_slots': 25,
                'is_open': False,
                'opens_at': timezone.now() + timedelta(days=60),
                'closes_at': timezone.now() + timedelta(days=90),
            }
        ]

        created_count = 0
        for slot_data in slots_data:
            slot, created = PremiumMembershipSlot.objects.get_or_create(
                name=slot_data['name'],
                defaults=slot_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created premium slot: {slot.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Premium slot already exists: {slot.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new premium slots')
        )