from django.contrib import admin

from .models import CounterOffer, Proposal


class CounterOfferInline(admin.TabularInline):
    model = CounterOffer
    extra = 0


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'receiver', 'status', 'offered_hours', 'requested_hours', 'updated_at')
    list_filter = ('status',)
    inlines = [CounterOfferInline]
