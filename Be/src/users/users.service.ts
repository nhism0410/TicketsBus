import { BadRequestException, Get, Injectable, NotFoundException, Req, UseGuards } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "./user.schema";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model <UserDocument>) {}
        async findOne(username: string): Promise<UserDocument | null> {
               return this.userModel.findOne({username}).exec();
        }
        async hashedPassword(password: string): Promise<string> {
            return bcrypt.hash(password, 10);
        }
        async create(
            username: string,
            password: string,
            email: string,
            role: string,
            emailVerified: boolean,
            isHashed: boolean = false, // New flag to skip hashing
          ): Promise<UserDocument> {
            try {
              // Check for existing user
              const existingUser = await this.userModel.findOne({ username }).exec();
              if (existingUser) {
                console.log('Username already exists:', username);
                throw new BadRequestException('Username already exists');
              }
        
              // Use pre-hashed password or hash it
              const hashedPassword = isHashed ? password : await bcrypt.hash(password, 10);
        
              const newUser = new this.userModel({
                username,
                password: hashedPassword,
                email,
                role,
                emailVerified,
              });
              const savedUser = await newUser.save();
              console.log('User created:', savedUser._id);
              return savedUser;
            } catch (error) {
              console.error('Error saving user to database:', error);
              throw new BadRequestException('Failed to create user: ' + error.message);
            }
          }
        async findById(id: string): Promise<UserDocument | null> {
            const userId = new Types.ObjectId(id);
            return this.userModel.findById(userId).exec();
        }
        async validateUser(username: string, password: string): Promise<UserDocument | null> {
            const user = await this.userModel.findOne({ username }).exec();
            if (user && user.password && (await bcrypt.compare(password, user.password))) {
              console.log('User validated successfully:', username);
              return user;
            }
            console.log('Invalid credentials for user:', username);
            return null;
          }
        async updateEmailVerified(userId: string, isEmailVerified: boolean): Promise<void> {
            const userIdObject = new Types.ObjectId(userId);
            await this.userModel.updateOne({ _id: userIdObject }, { isEmailVerified }).exec();
        }
          async delete(userId: string): Promise<void> {
            const result = await this.userModel.deleteOne({ _id: userId }).exec();
            if (result.deletedCount === 0) {
                throw new NotFoundException('User not found');
            }
        }
        async findByEmail(email: string): Promise<UserDocument | null> {
            return this.userModel.findOne({ email }).exec();
        }
        async updatePassword(userId: string, newPassword: string): Promise<void> {
            const userIdObject = new Types.ObjectId(userId);
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await this.userModel
                .updateOne({ _id: userIdObject }, { password: hashedPassword })
                .exec();
            if (result.matchedCount === 0) {
                throw new NotFoundException('User not found');
            }
        }
        async getUserById(userId: string) {
            return {
                username: 'user1',
                email: 'user1@example.com',
            };
        }
        async updateProfile(userData: any) {
            const user = await this.userModel.findOne({ username: userData.username });
          
            if (!user) {
              throw new Error('User not found');
            }
          
            // Update user fields if provided
            if (userData.firstName !== undefined) user.firstName = userData.firstName;
            if (userData.lastName !== undefined) user.lastName = userData.lastName;
            if (userData.email !== undefined) user.email = userData.email;
            if (userData.phone !== undefined) user.phone = userData.phone;
            if (userData.gender !== undefined) user.gender = userData.gender;
            
            // Handle date of birth - it should already be a Date object from the controller
            if (userData.dob !== undefined) {
              user.dob = userData.dob;
              console.log("Setting DOB to:", user.dob);
            }
            
            // Handle avatar update
            if (userData.avatar) {
              user.avatar = userData.avatar;
            }
          
            // Save and return the updated user
            const savedUser = await user.save();
            console.log("Saved user:", savedUser);
            return savedUser;
          }
        
          async updateAvatar(username: string, avatar: string): Promise<UserDocument> {
            const user = await this.userModel.findOne({ username }).exec();
            if (!user) {
              throw new NotFoundException('User not found');
            }
        
            user.avatar = avatar;
            
            try {
              return await user.save();
            } catch (error) {
              console.error('Error updating avatar:', error);
              throw new BadRequestException('Failed to update avatar: ' + error.message);
            }
          }
}