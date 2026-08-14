from django.shortcuts import render

class CalendarEventSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    start = serializers.DateTimeField(source="scheduled_start")
    end = serializers.DateTimeField(source="scheduled_end")
    extendedProps = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = ['id', 'title', 'start', 'end', 'extendedProps']

    def get_title(self, obj):
        offered = ", ".join([s.title for s in obj.offered_skills.all()])
        requested = ", ".join([s.title for s in obj.requested_skills.all()])
        return f"#{obj.id}: {offered} <-> {requested}"

    def get_extendedProps(self, obj):
        return {
            'status': obj.status
        }
