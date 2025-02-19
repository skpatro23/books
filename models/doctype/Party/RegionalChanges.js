import { cloneDeep } from 'lodash';
import PartyOriginal from './Party';

export default function getAugmentedParty({ country }) {
  const Party = cloneDeep(PartyOriginal);
  if (!country) {
    return Party;
  }

  if (country === 'India') {
    Party.fields.splice(
      3,
      0,
      {
        fieldname: 'gstin',
        label: 'GSTIN No.',
        fieldtype: 'Data',
        hidden: (doc) => (doc.gstType === 'Registered Regular' ? 0 : 1),
      },
      {
        fieldname: 'gstType',
        label: 'GST Registration Type',
        fieldtype: 'Select',
        options: ['Unregistered', 'Registered Regular', 'Consumer'],
      }
    );
    Party.quickEditFields.push('gstin');
  } else {
    Party.fields.splice(3, 0, {
      fieldname: 'taxId',
      label: 'Tax ID',
      fieldtype: 'Data',
    });
    Party.quickEditFields.push('taxId');
  }
  return Party;
}
