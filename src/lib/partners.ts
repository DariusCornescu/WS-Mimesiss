import connectDB from '@/lib/mongodb'
import { PartnerModel } from '@/models/Partner'
import type { Partner } from './partner-types'

export async function getPartners(publicOnly = false): Promise<Partner[]> {
  await connectDB()
  const records = await PartnerModel.find(publicOnly ? { visible: true } : {})
    .select('name logo category visible order').sort({ order: 1, _id: 1 }).lean()
  return records.map(record => ({
    id: String(record._id), name: record.name || '', logo: record.logo,
    category: record.category, visible: record.visible === true, order: record.order || 0,
  }))
}
