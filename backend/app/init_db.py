from app.database import engine, Base
from app.models.users import Users
from app.models.partners import Partners
from app.models.source_units import SourceUnits
from app.models.agreements import Agreements
from app.models.agreement_remarks import AgreementRemarks
from app.models.document_versions import DocumentVersions
from app.models.analytics_snapshots import AnalyticsSnapshots
from app.models.email_templates import EmailTemplates
from app.models.audit_logging import AuditLogging
from app.models.point_persons import PointPersons
from app.models.contact_persons import ContactPersons
from app.models.agreement_point_persons import AgreementPointPersons

# Only for local/test DB setup, do not run on late phases
# execute 'python -m app.init_db' on terminal (venv)

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)

"""
Ajhie's dependencies (check if complete din kayo or may kulang sa akin)
Package           Version
----------------- -------
alembic           1.16.4
annotated-types   0.7.0
anyio             4.9.0
click             8.2.1
colorama          0.4.6
fastapi           0.116.1
greenlet          3.2.3
h11               0.16.0
idna              3.10
Mako              1.3.10
MarkupSafe        3.0.2
pip               25.1.1
psycopg2-binary   2.9.10
pydantic          2.11.7
pydantic_core     2.33.2
python-dotenv     1.1.1
sniffio           1.3.1
SQLAlchemy        2.0.41
starlette         0.47.1
typing_extensions 4.14.1
typing-inspection 0.4.1
uvicorn           0.35.0
"""